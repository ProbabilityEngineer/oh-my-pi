# Hashline Format Improvements

## Summary

This PR implements significant improvements to the hashline edit mode format, making concurrent editing more reliable and reducing false hash mismatches.

## Changes

### 1. 6-Character Hex Hashes (was 2-char custom alphabet)

**Before:** `1#QQ:content` (2 chars from custom alphabet `[ZPMQVRWSNKTXJBYH]`)
**After:** `1#0077f9|content` (6 chars from hex `[0-9a-f]`)

**Benefits:**
- **Collision resistance:** 16.7M combinations (16^6) vs 256 (16^2)
- **Standard format:** Uses familiar hexadecimal instead of custom alphabet
- **Better debugging:** Hex hashes are easier to read and compare

**Implementation:**
- `computeLineHash()` now returns 6-char hex hash using `xxHash32() & 0xffffff`
- All regex patterns updated from `[ZPMQVRWSNKTXJBYH]{2}` to `[0-9a-f]{6}`

### 2. Pipe Separator (was colon)

**Before:** `LINE#HASH:CONTENT`
**After:** `LINE#HASH|CONTENT`

**Benefits:**
- **Clearer parsing:** Pipe character less likely to appear in code than colon
- **Better edge case handling:** Colons appear in TypeScript types, JSON, URLs
- **Unambiguous split:** First pipe is always the separator

**Implementation:**
- `formatHashLines()` uses `|` separator
- `formatLineTag()` returns tag without separator, content appended with `|`
- Streaming functions updated to use pipe format

### 3. Smart Partial Re-read on Hash Mismatch

When hashline edits fail due to stale hashes, the system now:

1. **Collects all mismatches** before throwing (not just first)
2. **Computes affected ranges** - compacts mismatched lines into contiguous ranges
3. **Provides remaps** - maps stale tags to correct current tags
4. **Shows context** - displays ±2 context lines with `>>>` markers on mismatches
5. **Auto-retries** - EditTool automatically updates hashes and retries

**Example error output:**
```
2 lines have changed since last read. Use the updated LINE#ID references shown below (>>> marks changed lines).

    1#abc123|function hello() {
>>> 2#def456|  return 42;
    3#789ghi|}
```

**Implementation:**
- `HashlineMismatchError` class with `remaps: Map<string,string>` and `affectedRanges: HashMismatchRange[]`
- `compactLineRanges()` helper compacts line numbers into contiguous ranges
- `EditTool.execute()` catches `HashlineMismatchError`, applies remaps, retries

## Testing

### New Scenario Tests (oh-my-pi-sjw)

Added 12 comprehensive scenario tests in `packages/coding-agent/test/core/hashline.test.ts`:

**6-char hash collision resistance (4 tests):**
- Verifies 6-char hex format
- Tests unique hashes for similar content
- Handles realistic code collision scenarios
- Maintains hash stability across invocations

**Pipe separator parsing (5 tests):**
- Validates formatHashLines uses pipe correctly
- Handles content with pipe characters (regex patterns)
- Handles empty lines with multiple pipes
- Verifies streaming functions preserve format

**Partial re-read on hash mismatch (6 tests):**
- Verifies HashlineMismatchError contains affectedRanges
- Compacts contiguous/non-contiguous mismatch lines
- Provides remaps for automatic retry
- Error message shows context lines with correct format

### Test Results

```
✓ 1355 pass
✓ 0 fail
✓ 832 skip
✓ 3137 expect() calls
```

All existing tests updated to expect new format.

## Files Modified

### Core Implementation
- `packages/coding-agent/src/patch/hashline.ts`
  - `computeLineHash()`: 6-char hex output
  - `formatHashLines()`: pipe separator
  - `formatLineTag()`: tag formatting
  - `HashlineMismatchError`: remaps + affectedRanges
  - `compactLineRanges()`: range compaction helper

### Test Updates
- `packages/coding-agent/test/core/hashline.test.ts`
  - Updated all existing tests for new format
  - Added 12 scenario tests

- `packages/coding-agent/test/tools.test.ts`
  - Updated grep tool test expectations

## Migration

**No breaking changes for users** - format is internal to edit tool operation.

**For developers:**
- Update regex patterns: `[ZPMQVRWSNKTXJBYH]{2}` → `[0-9a-f]{6}`
- Update separator: `:` → `|`
- Error handling can use `affectedRanges` for targeted re-reads

## Remaining Work

None - epic complete. All child tasks finished:
- ✅ oh-my-pi-0k0: Update hashline display and parsing functions
- ✅ oh-my-pi-1kb: Implement smart partial re-read on hash mismatch
- ✅ oh-my-pi-69n: Update hash computation to 6 hex characters
- ✅ oh-my-pi-mp2: Change hashline separator from colon to pipe
- ✅ oh-my-pi-sjw: Add scenario tests for hashline improvements

## Related Issues

- Closes oh-my-pi-dpr (EPIC: Hashline format improvements)
- Enables oh-my-pi-hrs (Integration testing and upstream PR preparation)
