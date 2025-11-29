# Revision Version

Update the version number across all files and ensure documentation is consistent.

## Usage

```
/revversion 0.6.0
```

The argument `$ARGUMENTS` is the new version number (e.g., `0.6.0` or `0.5.10`).

## Instructions

### 1. Validate the Version Argument

- If no version provided, stop and ask: "Please provide a version number, e.g., `/revversion 0.6.0`"
- Version should follow semver format: `MAJOR.MINOR.PATCH` (e.g., `0.6.0`, `1.0.0`, `0.5.10`)
- The argument may not include the "v" prefix, but it should be added where needed

### 2. Discover ALL Current Version Locations

**IMPORTANT:** Do NOT assume where versions are located. Search the entire codebase comprehensively.

Use multiple search strategies in parallel to find all version references:

```bash
# Search for common version patterns across the entire codebase
grep -rn "version.*['\"].*[0-9]\+\.[0-9]\+" . --include="*.json" --include="*.md" --include="*.html" --include="*.js" --include="*.ts" --include="*.yml" --include="*.yaml" --include="*.toml"

# Search for version-like strings (v0.x.x or 0.x.x format)
grep -rn "['\"]v\?[0-9]\+\.[0-9]\+\.[0-9]\+['\"]" . --include="*.json" --include="*.md" --include="*.html" --include="*.js" --include="*.ts"

# Search for common version keywords
grep -rn "Version [0-9]" . --include="*.md" --include="*.html"

# Check common files that might not show up in grep
ls -la | grep -E "package\.json|composer\.json|setup\.py|Cargo\.toml|pubspec\.yaml"
```

**Expected locations to check (but not limited to):**
- `package.json` - `"version"` field
- `README.md` - Version headers, badges, or display text
- `CHANGELOG.md` / `HISTORY.md` - Version history headers
- `index.html` - Version display elements or meta tags
- Source code files (`.js`, `.ts`, `.py`, etc.) - Hardcoded version strings
- Configuration files - Version metadata

### 3. Analyze and Report Findings

Before making ANY changes:
1. List ALL found version references with file path and line number
2. Identify the current version(s) - note if they're inconsistent
3. Show the user what you found and ask for confirmation to proceed
4. Warn if the NEW version seems wrong (e.g., downgrade or unusual jump)

### 4. Update ALL Version Locations

For EACH location found, update to the new version while preserving:
- Original formatting (with or without "v" prefix)
- Quote style (single vs double quotes)
- Surrounding context
- Indentation

**Common patterns to update:**

| Pattern | Example Before | Example After (for 0.3.2) |
|---------|---------------|---------------------------|
| JSON field | `"version": "0.3.1"` | `"version": "0.3.2"` |
| Markdown header | `## Version 0.3.1` | `## Version 0.3.2` |
| String literal | `version: '0.3.1'` | `version: '0.3.2'` |
| Display text | `fillText('v0.3.1', ...)` | `fillText('v0.3.2', ...)` |
| HTML content | `<div>v0.3.1</div>` | `<div>v0.3.2</div>` |
| Changelog header | `## [0.3.1] - 2025-01-15` | `## [0.3.2] - 2025-11-29` |

### 5. Update Documentation (If Present)

**Only if these files exist:**

- **README.md Version History**: Update or create current version entry
- **CHANGELOG.md**: Update or create entry with today's date (YYYY-MM-DD format)
- Mark new version as "(Current)" and remove from previous version

### 6. Verify Changes

After making updates, show a comprehensive summary:

```bash
# Show all updated locations
echo "=== All version locations ==="
grep -rn "['\"]v\?NEW_VERSION['\"]" . --include="*.json" --include="*.md" --include="*.html" --include="*.js" --include="*.ts" | head -20
```

Display a clear summary table showing:
- File path
- Line number
- Old version → New version
- Context (snippet of the line)

### 7. Remind About Documentation

After updating versions, remind the user:

> **Documentation Checklist:**
> - [ ] Add release notes for this version in README/CHANGELOG
> - [ ] Document any new features or breaking changes
> - [ ] Update any version-specific instructions
> - [ ] Review that all version numbers are now consistent

## Safety Notes

- **NEVER assume** file structure - always search first
- Always show the user what the OLD version(s) were and what NEW version will be set
- If version numbers are inconsistent across files, warn the user before proceeding
- Preserve original formatting and style in each file
- Do NOT commit changes - just make the edits and let the user review
- If you miss any version references, the user will tell you - learn from it
