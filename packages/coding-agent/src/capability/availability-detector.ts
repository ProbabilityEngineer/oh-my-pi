/**
 * Capability Availability Detector
 *
 * Detects runtime availability of optional capabilities (e.g., ast-grep, LSP servers).
 * Used for conditional prompt injection to avoid mentioning unavailable tools.
 */

import { logger } from "@oh-my-pi/pi-utils";

/**
 * Detected capabilities for the current session.
 */
export interface Capabilities {
	/** ast-grep structural search tool available */
	astGrep: boolean;
}

/**
 * Detect available capabilities based on installed binaries and environment.
 * @param cwd - Working directory for context (future use for project-specific detection)
 * @returns Promise resolving to capabilities object
 */
export async function detectCapabilities(_cwd?: string): Promise<Capabilities> {
	// Detect ast-grep binary
	const astGrep = await checkAstGrepAvailable();

	if (!astGrep) {
		logger.debug("capability:ast-grep:not-available");
	} else {
		logger.debug("capability:ast-grep:available");
	}

	return {
		astGrep,
	};
}

/**
 * Check if ast-grep binary is available in PATH.
 */
async function checkAstGrepAvailable(): Promise<boolean> {
	try {
		const binaryPath = Bun.which("ast-grep");
		return !!binaryPath;
	} catch {
		return false;
	}
}
