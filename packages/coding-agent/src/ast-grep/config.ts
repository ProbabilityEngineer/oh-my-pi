/**
 * AST-grep configuration and settings.
 */

/**
 * AST-grep specific settings.
 */
export interface AstGrepSettings {
	/** Enable or disable ast-grep tool */
	enabled: boolean;
	/** Default language to use when not specified */
	defaultLang?: string;
	/** Default result limit */
	defaultLimit: number;
	/** Path to ast-grep binary (auto-detected if not set) */
	binaryPath?: string;
}

/**
 * Default ast-grep settings.
 */
export const DEFAULT_AST_GREP_SETTINGS: AstGrepSettings = {
	enabled: true,
	defaultLimit: 100,
};

/**
 * Settings schema fragment for ast-grep.
 * This should be merged into the main settings schema.
 */
export const astGrepSettingsSchema = {
	"astgrep.enabled": {
		type: "boolean" as const,
		default: true,
		description: "Enable ast-grep structural search tool",
	},
	"astgrep.defaultLimit": {
		type: "number" as const,
		default: 100,
		description: "Default maximum number of ast-grep results to return",
	},
	"astgrep.binaryPath": {
		type: "string" as const,
		optional: true,
		description: "Custom path to ast-grep binary (auto-detected if not set)",
	},
} as const;
