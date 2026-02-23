// Application
export { applyPatch, defaultFileSystem, previewPatch } from "./applicator";

// ═══════════════════════════════════════════════════════════════════════════
// Re-exports
// ═══════════════════════════════════════════════════════════════════════════

export type {
	EditMode,
	EditToolDetails,
	HashlineParams,
	HashlineToolEdit,
	PatchParams,
	ReplaceParams,
} from "../tools/edit";
// Edit tool
export { DEFAULT_EDIT_MODE, EditTool, normalizeEditMode } from "../tools/edit";
// Application
export { applyPatch, defaultFileSystem, previewPatch } from "./applicator";
// Diff generation
export {
	computeEditDiff,
	computeHashlineDiff,
	computePatchDiff,
	generateDiffString,
	generateUnifiedDiffString,
	replaceText,
} from "./diff";
// Fuzzy matching
export { DEFAULT_FUZZY_THRESHOLD, findContextLine, findMatch as findEditMatch, findMatch, seekSequence } from "./fuzzy";
// Hashline
export {
	applyHashlineEdits,
	computeLineHash,
	formatHashLines,
	HashlineMismatchError,
	parseTag,
	streamHashLinesFromLines,
	streamHashLinesFromUtf8,
	validateLineRef,
} from "./hashline";
// Normalization
export { adjustIndentation, detectLineEnding, normalizeToLF, restoreLineEndings, stripBom } from "./normalize";
// Parsing
export { normalizeCreateContent, normalizeDiff, parseHunks as parseDiffHunks } from "./parser";
export type { EditRenderContext, EditToolDetails } from "./shared";
// Rendering
export { editToolRenderer, getLspBatchRequest } from "./shared";
export type {
	ApplyPatchOptions,
	ApplyPatchResult,
	ContextLineResult,
	DiffError,
	DiffError as EditDiffError,
	DiffHunk,
	DiffHunk as UpdateChunk,
	DiffHunk as UpdateFileChunk,
	DiffResult,
	DiffResult as EditDiffResult,
	FileChange,
	FileSystem,
	FuzzyMatch as EditMatch,
	FuzzyMatch,
	HashMismatch,
	MatchOutcome as EditMatchOutcome,
	MatchOutcome,
	Operation,
	PatchInput,
	SequenceSearchResult,
} from "./types";
// Types
// Legacy aliases for backwards compatibility
export { ApplyPatchError, EditMatchError, ParseError } from "./types";
