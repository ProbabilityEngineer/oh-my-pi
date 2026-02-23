/**
 * AST-grep Tool
 *
 * Structural code search using AST pattern matching.
 * AST-grep (ast-grep) is a fast and polyglot tool for code searching, linting, and rewriting.
 */

import type { AgentTool, AgentToolResult } from "@oh-my-pi/pi-agent-core";
import { logger } from "@oh-my-pi/pi-utils";
import { Type } from "@sinclair/typebox";
import { $ } from "bun";
import type { AstGrepMatch, AstGrepResult, AstGrepSearchParams, AstGrepToolDetails } from "../ast-grep";
import { checkAstGrepInstallation, getAstGrepInstallationGuidance } from "../ast-grep";
import type { ToolSession } from "./index";
import { shortenPath } from "./render-utils";

/**
 * AST-grep tool implementation.
 */
export class AstGrepTool implements AgentTool<any, AstGrepToolDetails> {
	public readonly name = "ast_grep";
	public readonly label = "AST Grep";
	public readonly description =
		"Search code structurally using AST pattern matching. Finds code patterns by syntax tree, not regex. Supports multiple languages including TypeScript, Python, Rust, Go, Java, and more.";

	public readonly parameters = Type.Object({
		pattern: Type.String({
			description:
				"AST pattern to search for. Use $MATCH for metavariables, $$$MATCH for multiple nodes. Example: 'function $NAME($$$ARGS) { $BODY }'",
		}),
		path: Type.Optional(
			Type.String({
				description: "File or directory to search (default: current working directory)",
			}),
		),
		lang: Type.Optional(
			Type.String({
				description:
					"Language filter (e.g., 'ts', 'tsx', 'py', 'rs', 'go', 'java'). Required if pattern language is ambiguous.",
			}),
		),
		glob: Type.Optional(
			Type.String({
				description: "Glob pattern to filter files (e.g., '*.ts', 'src/**/*.py')",
			}),
		),
		limit: Type.Optional(
			Type.Number({
				description: "Maximum number of results to return (default: 100)",
				default: 100,
				minimum: 1,
				maximum: 1000,
			}),
		),
	});

	constructor(private readonly session: ToolSession) {}

	async execute(
		_toolCallId: string,
		params: unknown,
		signal?: AbortSignal,
	): Promise<AgentToolResult<AstGrepToolDetails>> {
		const {
			pattern,
			path,
			lang,
			glob,
			limit = 100,
		} = params as {
			pattern: string;
			path?: string;
			lang?: string;
			glob?: string;
			limit?: number;
		};

		// Check if ast-grep is installed
		const installation = await checkAstGrepInstallation();
		if (!installation.installed) {
			return {
				content: [
					{
						type: "text",
						text: getAstGrepInstallationGuidance(),
					},
				],
				details: {
					error: "ast-grep not installed",
				},
			};
		}

		try {
			const result = await this.runSearch(
				{
					pattern,
					path,
					lang,
					glob,
					limit,
				},
				signal,
			);

			return this.formatResult(result);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error("ast-grep search failed", { pattern, path, lang, error: errorMessage });

			return {
				content: [
					{
						type: "text",
						text: `Error running ast-grep: ${errorMessage}`,
					},
				],
				details: {
					error: errorMessage,
				},
			};
		}
	}

	/**
	 * Run ast-grep search and return structured results.
	 */
	private async runSearch(params: AstGrepSearchParams, _signal?: AbortSignal): Promise<AstGrepResult> {
		const searchPath = params.path ?? this.session.cwd;
		const limit = params.limit ?? 100;

		// Build ast-grep command
		const args = ["--json", "--pattern", params.pattern];

		if (params.lang) {
			args.push("--lang", params.lang);
		}

		if (params.glob) {
			args.push("--glob", params.glob);
		}

		args.push(searchPath);

		// Run ast-grep
		const result = await $`ast-grep ${args}`.quiet().nothrow();

		if (result.exitCode !== 0) {
			const stderr = result.text();
			throw new Error(stderr || `ast-grep exited with code ${result.exitCode}`);
		}

		// Parse JSON output
		const output = result.text();
		if (!output.trim()) {
			return {
				matches: [],
				totalMatches: 0,
				truncated: false,
				params,
			};
		}

		const lines = output
			.trim()
			.split("\n")
			.filter((line: string) => line.trim());
		const matches: AstGrepMatch[] = lines.slice(0, limit).map((line: string) => {
			const parsed: {
				file: string;
				line: { number: number; column: number };
				lines: string;
				ruleId?: string;
				language: string;
			} = JSON.parse(line);
			return {
				path: parsed.file,
				line: parsed.line.number,
				column: parsed.line.column,
				code: parsed.lines,
				ruleId: parsed.ruleId,
				lang: parsed.language,
			};
		});

		return {
			matches,
			totalMatches: lines.length,
			truncated: lines.length > limit,
			params,
		};
	}

	/**
	 * Format search results for display.
	 */
	private formatResult(result: AstGrepResult): AgentToolResult<AstGrepToolDetails> {
		const { matches, totalMatches, truncated, params } = result;

		if (matches.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: `No matches found for pattern: ${params.pattern}`,
					},
				],
				details: {
					matchCount: 0,
					truncated: false,
					scopePath: params.path ?? this.session.cwd,
				},
			};
		}

		// Group matches by file
		const fileMap = new Map<string, AstGrepMatch[]>();
		for (const match of matches) {
			const existing = fileMap.get(match.path) || [];
			existing.push(match);
			fileMap.set(match.path, existing);
		}

		// Format output
		const lines: string[] = [];
		lines.push(
			`Found ${totalMatches} match${totalMatches !== 1 ? "es" : ""}${truncated ? ` (showing ${matches.length})` : ""} for pattern: ${params.pattern}`,
		);
		lines.push("");

		for (const [filePath, fileMatches] of fileMap) {
			const shortPath = shortenPath(filePath);
			lines.push(`\n${shortPath} (${fileMatches.length} match${fileMatches.length !== 1 ? "es" : ""})`);
			lines.push("─".repeat(Math.min(shortPath.length + 15, 60)));

			for (const match of fileMatches) {
				const langTag = match.lang ? ` [${match.lang}]` : "";
				lines.push(`\n${match.line}:${match.column}${langTag}`);
				// Show code snippet with indentation
				const codeLines = match.code.split("\n");
				for (const codeLine of codeLines) {
					lines.push(`  ${codeLine}`);
				}
			}
		}

		return {
			content: [
				{
					type: "text",
					text: lines.join("\n"),
				},
			],
			details: {
				matchCount: matches.length,
				fileCount: fileMap.size,
				truncated,
				scopePath: params.path ?? this.session.cwd,
				fileMatches: Array.from(fileMap.entries()).map(([path, matchList]) => ({
					path,
					count: matchList.length,
				})),
			},
		};
	}
}

// Re-export types for convenience
export type { AstGrepMatch, AstGrepResult, AstGrepSearchParams, AstGrepToolDetails } from "../ast-grep";
