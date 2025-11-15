# How to Restrict Claude Code to a Specific Folder

This guide explains how to use Claude Code hooks to restrict file operations to a specific folder (e.g., `cattown`), preventing accidental modifications to other parts of your project.

## Table of Contents
- [Overview](#overview)
- [Settings File Locations](#settings-file-locations)
- [Hook Configuration Basics](#hook-configuration-basics)
- [Restricting to a Specific Folder](#restricting-to-a-specific-folder)
- [Environment Variables](#environment-variables)
- [Exit Codes and Blocking](#exit-codes-and-blocking)
- [JSON Output Format](#json-output-format)
- [Testing Your Hooks](#testing-your-hooks)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

---

## Overview

Claude Code **hooks** are configurable scripts that run automatically during different stages of Claude's operation. They allow you to:

- Validate file paths before operations
- Block operations outside specific directories
- Add custom checks and validations
- Automate workflows based on Claude's actions

---

## Settings File Locations

Hooks are defined in JSON configuration files. Claude Code uses a hierarchical settings system:

### 1. **User Settings** (Global)
- **Location:** `~/.claude/settings.json`
- **Scope:** Applies to all projects for your user
- **Use Case:** Personal preferences and global rules

### 2. **Project Settings** (Shared)
- **Location:** `.claude/settings.json` (in project root)
- **Scope:** Applies to all users of the project
- **Use Case:** Team-wide standards, checked into version control

### 3. **Project Local Settings** (Personal + Project-Specific)
- **Location:** `.claude/settings.local.json` (in project root)
- **Scope:** Personal settings for this specific project only
- **Use Case:** Your personal rules for this project
- **Note:** Automatically git-ignored, won't affect other team members

### Configuration Precedence (Highest to Lowest)
1. Enterprise managed policies
2. Command line arguments
3. **Local project settings** (`.claude/settings.local.json`)
4. **Shared project settings** (`.claude/settings.json`)
5. User settings (`~/.claude/settings.json`)

**Recommendation:** Use `.claude/settings.local.json` for folder restrictions so you don't force these restrictions on other collaborators.

---

## Hook Configuration Basics

### Structure

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "your-shell-command-here"
          }
        ]
      }
    ]
  }
}
```

### Available Hook Events

| Event | When It Triggers |
|-------|------------------|
| `PreToolUse` | Before Claude executes a tool (best for validation) |
| `PostToolUse` | After a tool completes successfully |
| `UserPromptSubmit` | When user submits a prompt |
| `Notification` | When Claude needs permission or is waiting |
| `Stop` | When Claude finishes responding |
| `SubagentStop` | When a subagent finishes |
| `SessionStart` | At session beginning |
| `SessionEnd` | At session conclusion |

### Matcher Patterns

The `matcher` field specifies which tools trigger the hook:

- **Exact match:** `"Write"` (only Write tool)
- **Multiple tools:** `"Edit|Write"` (regex OR)
- **Pattern matching:** `"Notebook.*"` (all Notebook tools)
- **All tools:** `"*"` or `""` (empty string)

**Note:** Matchers are case-sensitive!

### Common Tools for File Operations

- `Read` - Reading files
- `Write` - Creating new files
- `Edit` - Modifying existing files
- `Glob` - Finding files by pattern
- `Grep` - Searching file contents
- `Bash` - Running shell commands (may modify files)

---

## Restricting to a Specific Folder

### Method 1: Simple Path Validation (Recommended)

This approach validates that file paths start with your target folder.

**File:** `.claude/settings.local.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"$CLAUDE_TOOL_INPUT\" | jq -r '.file_path // .filePath // .path // empty' | grep -q '^/workspaces/LocalDev/cattown/' || { echo 'Error: File operations restricted to cattown folder only!' >&2; exit 2; }"
          }
        ]
      }
    ]
  }
}
```

**What this does:**
1. Triggers before `Edit` or `Write` operations
2. Extracts the file path from Claude's tool input
3. Checks if path starts with `/workspaces/LocalDev/cattown/`
4. If not, prints error message and blocks operation (exit code 2)

### Method 2: Using a Validation Script (More Flexible)

For complex validation logic, use an external script:

**Step 1:** Create validation script

**File:** `/workspaces/LocalDev/cattown/scripts/validate-path.sh`

```bash
#!/bin/bash

# Extract file path from CLAUDE_TOOL_INPUT
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .filePath // .path // empty')

# Define allowed directory
ALLOWED_DIR="/workspaces/LocalDev/cattown"

# Check if file path is within allowed directory
if [[ "$FILE_PATH" == "$ALLOWED_DIR"* ]]; then
  # Path is valid
  exit 0
else
  # Path is outside allowed directory - block operation
  echo "❌ ERROR: File operations are restricted to the cattown folder only!" >&2
  echo "   Attempted path: $FILE_PATH" >&2
  echo "   Allowed path: $ALLOWED_DIR" >&2
  exit 2
fi
```

**Step 2:** Make script executable

```bash
chmod +x /workspaces/LocalDev/cattown/scripts/validate-path.sh
```

**Step 3:** Configure hook to use script

**File:** `.claude/settings.local.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/cattown/scripts/validate-path.sh"
          }
        ]
      }
    ]
  }
}
```

### Method 3: Comprehensive Protection (All File Operations)

To restrict ALL file-related operations, not just Edit/Write:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|Read|Glob|Grep",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/cattown/scripts/validate-path.sh"
          }
        ]
      }
    ]
  }
}
```

**Warning:** Restricting `Read`, `Glob`, and `Grep` may limit Claude's ability to understand your codebase context.

### Method 4: Using JSON Output for Better User Experience

For more detailed feedback:

**File:** `/workspaces/LocalDev/cattown/scripts/validate-path-json.sh`

```bash
#!/bin/bash

FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .filePath // .path // empty')
ALLOWED_DIR="/workspaces/LocalDev/cattown"

if [[ "$FILE_PATH" == "$ALLOWED_DIR"* ]]; then
  # Allow operation
  cat <<EOF
{
  "continue": true
}
EOF
  exit 0
else
  # Block operation with detailed message
  cat <<EOF
{
  "continue": false,
  "stopReason": "File operations are restricted to the cattown folder only. Attempted path: $FILE_PATH",
  "systemMessage": "Path validation failed: Operations are only allowed within /workspaces/LocalDev/cattown/"
}
EOF
  exit 2
fi
```

---

## Environment Variables

Your hook commands have access to these environment variables:

| Variable | Description | Availability |
|----------|-------------|--------------|
| `CLAUDE_TOOL_INPUT` | JSON object with tool parameters | PreToolUse, PostToolUse |
| `CLAUDE_PROJECT_DIR` | Absolute path to project root | All hooks |
| `CLAUDE_PLUGIN_ROOT` | Absolute path to plugin directory | All hooks |

### Example: Parsing CLAUDE_TOOL_INPUT

The structure varies by tool. Common fields:

```json
{
  "file_path": "/path/to/file",     // For Edit/Write/Read
  "filePath": "/path/to/file",      // Alternative name
  "path": "/path/to/file",          // Alternative name
  "pattern": "*.js",                // For Glob
  "command": "npm test"             // For Bash
}
```

Use `jq` to parse JSON safely:

```bash
# Try multiple possible field names
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .filePath // .path // empty')
```

---

## Exit Codes and Blocking

Your hook script's exit code determines what happens:

| Exit Code | Behavior | Use Case |
|-----------|----------|----------|
| `0` | **Success** - Allow operation to continue | Path is valid |
| `2` | **Block operation** - Show stderr to Claude and user | Path is invalid |
| Other | **Non-blocking error** - Log warning but continue | Soft validation |

### Blocking Example

```bash
if [[ "$FILE_PATH" != "/allowed/path"* ]]; then
  echo "ERROR: This path is not allowed!" >&2
  exit 2
fi
```

---

## JSON Output Format

For advanced control, your hook can output JSON to control Claude's behavior:

### JSON Fields

```json
{
  "continue": true,              // Whether operation should continue (default: true)
  "stopReason": "string",        // Message shown if continue=false
  "suppressOutput": false,       // Hide stdout from transcript (default: false)
  "systemMessage": "string"      // Optional warning/info message for user
}
```

### Example: Blocking with JSON

```bash
#!/bin/bash

# Validation logic here...

if [[ $VALIDATION_FAILED ]]; then
  cat <<'EOF'
{
  "continue": false,
  "stopReason": "Operation blocked: File must be in cattown folder",
  "systemMessage": "Please specify a file path within /workspaces/LocalDev/cattown/"
}
EOF
  exit 2
fi
```

**Benefits:**
- More structured error messages
- Better integration with Claude's UI
- Can provide contextual help to users

---

## Testing Your Hooks

### 1. Enable Debug Mode

Run Claude with debug flag to see detailed hook execution:

```bash
claude --debug
```

This shows:
- Which hooks are triggered
- Hook output (stdout/stderr)
- Exit codes
- Execution timing

### 2. Test Manually

Test your hook script directly:

```bash
# Simulate CLAUDE_TOOL_INPUT
export CLAUDE_TOOL_INPUT='{"file_path":"/workspaces/LocalDev/cattown/test.txt"}'
export CLAUDE_PROJECT_DIR="/workspaces/LocalDev"

# Run your script
bash /workspaces/LocalDev/cattown/scripts/validate-path.sh

# Check exit code
echo "Exit code: $?"
```

### 3. Test Both Success and Failure Cases

```bash
# Test valid path (should exit 0)
export CLAUDE_TOOL_INPUT='{"file_path":"/workspaces/LocalDev/cattown/file.txt"}'
bash validate-path.sh
echo "Exit code: $?" # Should be 0

# Test invalid path (should exit 2)
export CLAUDE_TOOL_INPUT='{"file_path":"/workspaces/LocalDev/other/file.txt"}'
bash validate-path.sh
echo "Exit code: $?" # Should be 2
```

### 4. Verify Settings File Syntax

Validate your JSON configuration:

```bash
jq empty .claude/settings.local.json
```

If there's a syntax error, `jq` will report it.

### 5. Test in Real Session

1. Save your hook configuration
2. Start a new Claude session
3. Try to edit a file outside the allowed folder
4. Verify you see the error message
5. Try to edit a file inside the allowed folder
6. Verify it succeeds

---

## Troubleshooting

### Hook Not Triggering

**Check:**
1. Settings file location is correct
2. JSON syntax is valid (use `jq empty settings.local.json`)
3. Matcher pattern matches the tool name (case-sensitive!)
4. Hook command is executable (if using script file)
5. Run with `--debug` to see hook execution logs

### Hook Blocking When It Shouldn't

**Check:**
1. Path comparison logic (absolute vs relative paths)
2. Environment variable is populated correctly
3. String matching includes trailing slash handling
4. Test script manually with sample inputs

### Error: "command not found"

**Solutions:**
- Use absolute paths: `/usr/bin/jq` instead of `jq`
- Or ensure PATH includes necessary tools
- Or use `$CLAUDE_PROJECT_DIR` for project scripts

### Permission Denied

```bash
# Make script executable
chmod +x /path/to/script.sh
```

### Hook Slows Down Claude

**Optimization:**
- Keep validation logic simple
- Avoid network calls or heavy operations
- Use exit codes for fast path (don't always generate JSON)
- Profile script execution time

---

## Security Considerations

### 1. **Input Validation**

Always validate and sanitize inputs:

```bash
# BAD - vulnerable to injection
eval "$CLAUDE_TOOL_INPUT"

# GOOD - parse with jq
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // empty')
```

### 2. **Use Quoted Variables**

```bash
# BAD - breaks with spaces/special chars
if [ $FILE_PATH == "/allowed" ]; then

# GOOD - properly quoted
if [[ "$FILE_PATH" == "/allowed"* ]]; then
```

### 3. **Path Traversal Protection**

Prevent `../` attacks:

```bash
# Resolve to canonical path
REAL_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null)
ALLOWED_REAL=$(realpath -m "$ALLOWED_DIR")

# Check resolved path
if [[ "$REAL_PATH" == "$ALLOWED_REAL"* ]]; then
  exit 0
fi
```

### 4. **Avoid Sensitive Files**

Even within allowed directory, block sensitive files:

```bash
# Block .env files, credentials, etc.
if [[ "$FILE_PATH" =~ \.env$ ]] || \
   [[ "$FILE_PATH" =~ credentials ]] || \
   [[ "$FILE_PATH" =~ secret ]]; then
  echo "ERROR: Cannot modify sensitive files!" >&2
  exit 2
fi
```

### 5. **Limit Hook Permissions**

- Don't run hooks as root
- Use minimal file permissions for hook scripts
- Avoid hooks that make network requests or execute arbitrary code

### 6. **Review Hook Code**

- Treat hooks like any other code: review before use
- Be cautious with hooks from untrusted sources
- Test in a safe environment first

---

## Complete Example Configuration

### File: `.claude/settings.local.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "comment": "Restrict file modifications to cattown folder only",
            "command": "$CLAUDE_PROJECT_DIR/cattown/scripts/validate-path.sh"
          }
        ]
      }
    ]
  }
}
```

### File: `cattown/scripts/validate-path.sh`

```bash
#!/bin/bash
set -euo pipefail

# Configuration
ALLOWED_DIR="/workspaces/LocalDev/cattown"

# Extract file path from tool input
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .filePath // .path // empty')

# If no file path found (e.g., Bash command), allow by default
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Resolve to canonical paths (handles ../ and symlinks)
REAL_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")
ALLOWED_REAL=$(realpath -m "$ALLOWED_DIR")

# Check if path is within allowed directory
if [[ "$REAL_PATH" == "$ALLOWED_REAL"* ]]; then
  # Path is valid - allow operation
  exit 0
else
  # Path is outside allowed directory - block operation
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "❌  FILE OPERATION BLOCKED" >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  echo "" >&2
  echo "File operations are restricted to the cattown folder." >&2
  echo "" >&2
  echo "Attempted: $FILE_PATH" >&2
  echo "Allowed:   $ALLOWED_DIR/*" >&2
  echo "" >&2
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
  exit 2
fi
```

Make executable:
```bash
chmod +x /workspaces/LocalDev/cattown/scripts/validate-path.sh
```

---

## Alternative Approaches

### Permissions-Based Restriction

You can also use Claude's permissions system to block tools entirely:

```json
{
  "permissions": {
    "deny": [
      "Write(/workspaces/LocalDev/funnel/**)",
      "Write(/workspaces/LocalDev/pong/**)",
      "Edit(/workspaces/LocalDev/funnel/**)",
      "Edit(/workspaces/LocalDev/pong/**)"
    ]
  }
}
```

**Limitations:**
- Less flexible than hooks
- Cannot provide dynamic validation
- Requires listing all blocked paths explicitly

**Hooks are recommended** for folder restrictions because they provide:
- Dynamic path validation
- Better error messages
- More flexibility for complex rules

---

## Summary

1. **Use `.claude/settings.local.json`** for personal folder restrictions
2. **Create a validation script** in your target folder
3. **Use `PreToolUse` hooks** with `Edit|Write` matcher
4. **Test thoroughly** with `--debug` flag
5. **Handle edge cases** (relative paths, symlinks, etc.)
6. **Provide clear error messages** so Claude understands constraints

### Quick Start

```bash
# 1. Create validation script
mkdir -p /workspaces/LocalDev/cattown/scripts
cat > /workspaces/LocalDev/cattown/scripts/validate-path.sh << 'EOF'
#!/bin/bash
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .filePath // .path // empty')
if [[ -z "$FILE_PATH" ]] || [[ "$FILE_PATH" == "/workspaces/LocalDev/cattown"* ]]; then
  exit 0
else
  echo "Error: File operations restricted to cattown folder only!" >&2
  exit 2
fi
EOF

# 2. Make executable
chmod +x /workspaces/LocalDev/cattown/scripts/validate-path.sh

# 3. Add hook to .claude/settings.local.json
# (See complete example above)

# 4. Test
claude --debug
```

---

## Additional Resources

- [Official Claude Code Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks)
- [Official Settings Documentation](https://docs.claude.com/en/docs/claude-code/settings)
- [Claude Code Documentation Map](https://docs.claude.com/en/docs/claude-code/claude_code_docs_map.md)

---

**Last Updated:** January 2025
**Verified Against:** Claude Code latest documentation
