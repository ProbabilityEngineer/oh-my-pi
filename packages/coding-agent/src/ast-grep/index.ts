/**
 * AST-grep Module
 *
 * Provides structural code search using AST pattern matching.
 * AST-grep (ast-grep) is a fast and polyglot tool for code searching, linting, and rewriting.
 *
 * @module ast-grep
 */

import { $ } from "bun";

export * from "./config";
export * from "./types";

/**
 * Check if ast-grep binary is available and return installation status.
 */
export async function checkAstGrepInstallation(): Promise<{
	installed: boolean;
	binaryPath?: string;
	version?: string;
}> {
	try {
		const binaryPath = await Bun.which("ast-grep");
		if (!binaryPath) {
			return { installed: false };
		}

		// Get version
		const result = await $`${binaryPath} --version`.quiet();
		const version = result.exitCode === 0 ? result.text().trim() : undefined;

		return {
			installed: true,
			binaryPath,
			version,
		};
	} catch {
		return { installed: false };
	}
}

/**
 * Get installation guidance message for user.
 */
export function getAstGrepInstallationGuidance(): string {
	return `ast-grep is not installed. Install it to enable structural code search:

  # Using Homebrew (macOS)
  brew install ast-grep

  # Using Cargo (Rust)
  cargo install ast-grep

  # Using npm
  npm install -g @ast-grep/cli

After installation, the ast-grep tool will be automatically available.`;
}
