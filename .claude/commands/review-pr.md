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
# Get inline review comments (code-level comments from reviewers)
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments

# Get PR reviews (approve, request changes, etc.)
gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews

# Get changed files
gh pr view {pr_number} --json files
```

### Step 2: Analyze Each Review Comment

For each **inline review comment** (from `pulls/{pr_number}/comments`):

1. `id` - **The comment ID you MUST use when replying** (e.g., `2929531234`)
2. `path` - File path
3. `line` or `original_line` - Line number
4. `body` - Review content
5. `diff_hunk` - Code context
6. `in_reply_to_id` - If this is already a reply in a thread, use the root comment's ID
7. Determine if code change is needed

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
git push
```

### Step 6: Reply to Review Comments (CRITICAL)

**IMPORTANT: You MUST reply to each inline review comment using the Pull Request Review Comments API, NOT issue comments.**

Use this exact API endpoint to reply to each review comment thread:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -X POST -f body="Fixed in abc1234.

- Description of what was changed"
```

- `{comment_id}` is the `id` field from the review comment (Step 2)
- If the comment has `in_reply_to_id`, use that value instead (reply to the thread root)

**NEVER use these commands (they create issue-level comments, NOT review replies):**

```bash
# WRONG - creates an issue comment, not a review reply
gh pr comment {pr_number} --body "..."

# WRONG - this is the issues API, not the pull request reviews API
gh api repos/{owner}/{repo}/issues/{pr_number}/comments -X POST -f body="..."
```

The difference:

- Review comment reply → appears inline in the code diff thread (correct)
- Issue comment → appears at the bottom of the PR conversation (wrong)

## Reply Format Rules

### Commit Hash Formatting

**NEVER wrap commit hashes in backticks or code blocks.** GitHub only auto-links plain text commit hashes.

| Format  | Example             | Result                   |
| ------- | ------------------- | ------------------------ |
| CORRECT | Fixed in f3b5fec.   | Clickable link to commit |
| WRONG   | Fixed in `f3b5fec`. | Plain text, no link      |

## Result Report

After addressing all comments, report:

- List of modified files
- Summary of changes per file
- Commit hash
- Any comments not addressed and why

## Notes

- If a comment is a question or praise, reply acknowledging it (no code change needed)
- If reviewer intent is unclear, ask for clarification
- Use `bun` exclusively for all commands
- Bot reviews (gemini-code-assist, coderabbitai) should also be replied to inline
