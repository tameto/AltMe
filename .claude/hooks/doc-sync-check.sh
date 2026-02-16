#!/bin/bash
# doc-sync-check.sh - PostToolUse hook for Write|Edit
# Detects when implementation files are modified and warns if corresponding
# SDD spec documents may be outdated.

# Get the file path from the tool input (passed via stdin as JSON)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')

# If no file path found, exit silently
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check implementation files
case "$FILE_PATH" in
  */src/features/*|*/src/shared/*|*/src/services/*|*/supabase/functions/*|*/supabase/migrations/*)
    ;;
  *)
    exit 0
    ;;
esac

# Find the repo root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  exit 0
fi

# Check if any .sdd/specs/ directories exist
SPECS_DIR="$REPO_ROOT/.sdd/specs"
if [ ! -d "$SPECS_DIR" ]; then
  exit 0
fi

# Get current branch to match with spec directory
BRANCH=$(git branch --show-current 2>/dev/null)
if [ -z "$BRANCH" ]; then
  exit 0
fi

# Find matching spec directory
SPEC_DIR=""
for dir in "$SPECS_DIR"/*/; do
  dirname=$(basename "$dir")
  if echo "$BRANCH" | grep -q "$dirname"; then
    SPEC_DIR="$dir"
    break
  fi
done

# If no matching spec dir, exit
if [ -z "$SPEC_DIR" ]; then
  exit 0
fi

SPEC_FILE="${SPEC_DIR}spec.md"
if [ ! -f "$SPEC_FILE" ]; then
  exit 0
fi

# Compare modification times
IMPL_MTIME=$(stat -f %m "$FILE_PATH" 2>/dev/null || stat -c %Y "$FILE_PATH" 2>/dev/null)
SPEC_MTIME=$(stat -f %m "$SPEC_FILE" 2>/dev/null || stat -c %Y "$SPEC_FILE" 2>/dev/null)

if [ -n "$IMPL_MTIME" ] && [ -n "$SPEC_MTIME" ]; then
  if [ "$IMPL_MTIME" -gt "$SPEC_MTIME" ]; then
    RELATIVE_IMPL=$(echo "$FILE_PATH" | sed "s|$REPO_ROOT/||")
    RELATIVE_SPEC=$(echo "$SPEC_FILE" | sed "s|$REPO_ROOT/||")
    echo "NOTE: Doc sync recommended: $RELATIVE_SPEC may be outdated relative to $RELATIVE_IMPL. Run /sdd-analyze or use doc-updater agent."
  fi
fi

exit 0
