# Squash Checkpoint Commits

Squash all commits from the most recent CHECKPOINT commit through HEAD into a single commit.

## Instructions

1. **Find the CHECKPOINT commit**: Look at recent git history (`git log --oneline -20`) and find the most recent commit containing "CHECKPOINT" (case-sensitive, all caps) in its message.

2. **If no CHECKPOINT found**: Stop immediately and tell the user: "No CHECKPOINT commit found in recent history. Please create a checkpoint first with a commit message containing CHECKPOINT."

3. **Verify there are commits to squash**: There should be at least the CHECKPOINT commit itself. If CHECKPOINT is already HEAD and there are no CP commits after it, ask if they want to just rename it.

4. **Perform the squash**:
   - Find the parent of the CHECKPOINT commit
   - Run: `git reset --soft <parent-hash>`
   - Create new commit with the provided message

5. **Commit message**: Use the argument provided: $ARGUMENTS
   - If no argument provided, ask the user for a commit message

6. **Show result**: After squashing, show `git log --oneline -5` to confirm the result.

## Safety

- Anything in Changes before the process should still be there after. Warn and ask if anything will get pulled in or lost.
- Do NOT force push - just do the local squash
- If anything looks wrong, stop and ask the user
