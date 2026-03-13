# Review PR Comments

Review and address PR review comments for this repository.

## Arguments

- `$ARGUMENTS` - PR number (e.g., `123`) or PR URL

## Project-Specific Build Commands

Based on changed files, run these checks BEFORE committing:

| Path | Commands |
| --- | --- |
| `packages/kstyled/` | `bun run lint && bun run typecheck && bun run test` |
| `packages/babel-plugin-kstyled/` | `bun run lint && bun run typecheck && bun run test` |

## Workflow

### Step 1: Get PR Information

```bash
# Get PR review comments
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments

# Get PR reviews (approve, request changes, etc.)
gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews

# Get changed files
gh pr view {pr_number} --json files
```

### Step 2: Analyze Each Comment

For each review comment:

1. `path` - File path
2. `line` or `original_line` - Line number
3. `body` - Review content
4. `diff_hunk` - Code context
5. Determine if code change is needed

### Step 3: Apply Fixes

1. Read the target file
2. Apply changes per reviewer feedback
3. Track changes with TodoWrite
4. Run project-specific checks

### Step 4: Run Checks Before Commit

```bash
bun run lint
bun run typecheck
bun run test
```

### Step 5: Commit Changes

```bash
git add <changed-files>
git commit -m "$(cat <<'EOF'
fix: address PR review comments

- <summary of change 1>
- <summary of change 2>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 6: Reply to Comments

Reply to each addressed comment:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -X POST -f body="Fixed in abc1234.

**Changes:**
- Description of what was changed"
```

## Reply Format Rules (CRITICAL)

When replying to PR comments:

### Commit Hash Formatting

**NEVER wrap commit hashes in backticks or code blocks.** GitHub only auto-links plain text commit hashes.

| Format     | Example                 | Result                   |
| ---------- | ----------------------- | ------------------------ |
| CORRECT | `Fixed in f3b5fec.`     | Clickable link to commit |
| WRONG   | `Fixed in \`f3b5fec\`.` | Plain text, no link      |

## Result Report

After addressing all comments, report:

- List of modified files
- Summary of changes per file
- Commit hash
- Any comments not addressed and why

## Notes

- If a comment is a question or praise, no code change needed
- If reviewer intent is unclear, ask for clarification
- Use `bun` exclusively for all commands
