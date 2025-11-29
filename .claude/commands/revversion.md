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
- The agument may not include the "v" prefix, but it should be added where needed

### 2. Find Current Version

Run a quick search to identify the current version in the codebase:
- Check `package.json` for the `"version"` field
- Note this as the OLD version for comparison
- Warn and ask if the NEW version seems wrong based on the OLD version

### 3. Update Version in All Locations

Update the version number in these files:

| File | Location | Format |
|------|----------|--------|
| `index.html` | `<div id="version">` element | `v0.X.Y` (with "v" prefix) |
| `package.json` | `"version"` field | `0.X.Y` (no prefix) |
| `README.md` | Line 3: `**Version X.X.X**` | `0.X.Y` (no prefix) |
| `README.md` | Version History section header | `### vX.X.X (Current)` (with "v" prefix) |
| `CHANGELOG.md` | Latest version header | `## [X.X.X] - YYYY-MM-DD` (no prefix, with date) |

### 4. Update Version History in README.md

- Find the `## 📝 Version History` section
- The FIRST version entry should be marked `(Current)` and match the new version
- If the new version doesn't exist yet, add a new entry at the top:
  ```markdown
  ### vX.X.X (Current)
  - (Add release notes here)
  ```
- Remove `(Current)` from the previous version entry

### 5. Update CHANGELOG.md

- Find the most recent version header at the top (after the intro text)
- If the new version doesn't exist, add a new entry:
  ```markdown
  ## [X.X.X] - YYYY-MM-DD

  ### Added
  - (Features added)

  ### Changed
  - (Changes made)

  ### Fixed
  - (Bugs fixed)
  ```
- Use today's date in YYYY-MM-DD format

### 6. Verify Changes

After making updates, run these checks:
```bash
grep -n "version" package.json | head -1
grep -n "Version" README.md | head -1
grep -n "id=\"version\"" index.html
grep -n "^\## \[" CHANGELOG.md | head -1
```

Show the user a summary of what was changed.

### 7. Remind About Documentation

After updating versions, remind the user:

> **Documentation Checklist:**
> - [ ] README.md version history has release notes for this version
> - [ ] CHANGELOG.md has detailed changes under Added/Changed/Fixed sections
> - [ ] Any new features are documented in README.md's feature sections
> - [ ] Control changes are reflected in the How to Play section

## Safety Notes

- Always show the user what the OLD version was and what NEW version is being set
- If version numbers are inconsistent across files, warn the user before proceeding
- Do NOT commit changes - just make the edits and let the user review
- If a version entry already exists in CHANGELOG or README history, update it rather than creating a duplicate
