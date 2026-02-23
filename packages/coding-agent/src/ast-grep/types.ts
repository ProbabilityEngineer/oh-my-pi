/**
 * AST-grep integration types and interfaces.
 *
 * AST-grep is a structural search tool that uses AST pattern matching to find
 * code patterns. This module provides type-safe interfaces for ast-grep integration.
 */

/**
 * AST-grep search result with location and matched code.
 */
export interface AstGrepMatch {
	/** File path where match was found */
	path: string;
	/** Line number (1-indexed) */
	line: number;
	/** Column number (1-indexed) */
	column: number;
	/** Matched code snippet */
	code: string;
	/** Rule ID that matched */
	ruleId?: string;
	/** Language of the file */
	lang: string;
}

/**
 * AST-grep search parameters.
 */
export interface AstGrepSearchParams {
	/** Pattern to search for (in ast-grep pattern syntax) */
	pattern: string;
	/** File or directory to search (default: cwd) */
	path?: string;
	/** File extension or language filter (e.g., "ts", "py", "rust") */
	lang?: string;
	/** Glob pattern to filter files (e.g., "*.ts") */
	glob?: string;
	/** Maximum number of results to return (default: 100) */
	limit?: number;
	/** Skip first N results (default: 0) */
	offset?: number;
	/** Include context lines before match */
	before?: number;
	/** Include context lines after match */
	after?: number;
}

/**
 * AST-grep search result.
 */
export interface AstGrepResult {
	/** List of matches found */
	matches: AstGrepMatch[];
	/** Total number of matches (may exceed limit if truncated) */
	totalMatches: number;
	/** Whether results were truncated due to limit */
	truncated: boolean;
	/** Search parameters used */
	params: AstGrepSearchParams;
}

/**
 * AST-grep tool execution details for display.
 */
export interface AstGrepToolDetails {
	/** Number of matches found */
	matchCount?: number;
	/** Number of files searched */
	fileCount?: number;
	/** Whether results were truncated */
	truncated?: boolean;
	/** Error message if search failed */
	error?: string;
	/** Scope path that was searched */
	scopePath?: string;
	/** List of files with match counts */
	fileMatches?: Array<{ path: string; count: number }>;
}

/**
 * AST-grep binary installation status.
 */
export interface AstGrepInstallationStatus {
	/** Whether ast-grep binary is available */
	installed: boolean;
	/** Path to ast-grep binary if found */
	binaryPath?: string;
	/** Version string if installed */
	version?: string;
}
