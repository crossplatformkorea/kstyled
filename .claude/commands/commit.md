# Commit Changes

Complete workflow: branch → commit → push → PR

## Usage

```
/commit [options]
```

**Options:**

- `--push` or `-p`: Push to remote after commit
- `--pr`: Create PR after push
- `--all` or `-a`: Commit all changes at once
- `<path>`: Commit only specific path (e.g., `packages/kstyled`, `packages/babel-plugin-kstyled`)

## Examples

```bash
# Full workflow: commit src changes, push, create PR
/commit packages/kstyled --pr

# Commit all and create PR
/commit --all --pr

# Just commit specific path
/commit packages/babel-plugin-kstyled
```

## Complete Workflow

### 1. Check Branch

```bash
# Check current branch
git branch --show-current
```

**If on `main`** → Create a feature branch first:

```bash
git checkout -b feat/<feature-name>
```

**If NOT on `main`** → Proceed with commits directly.

**Branch naming conventions:**

- `feat/<feature-name>` - New features
- `fix/<bug-description>` - Bug fixes
- `docs/<doc-update>` - Documentation only
- `chore/<task>` - Maintenance tasks

### 2. Pre-Commit Checks (CRITICAL)

Before staging any changes, run the following checks:

```bash
# Lint check
bun run lint

# Type check
bun run typecheck

# Run tests
bun run test
```

**IMPORTANT:** Only proceed with commit if ALL checks pass.

### 3. Check Current Status

```bash
git status
git diff --name-only
```

### 4. Stage Changes

**kstyled package:**

```bash
git add packages/kstyled/
```

**Babel plugin:**

```bash
git add packages/babel-plugin-kstyled/
```

**All changes:**

```bash
git add .
```

### 5. Review Staged Changes

```bash
git diff --cached --stat
git diff --cached --name-only
```

### 6. Create Commit

Follow Angular Conventional Commit format:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<body - what changed and why>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

**Commit Types:** | Type | Description | |------|-------------| | `feat` | New feature | | `fix` | Bug fix | | `docs` | Documentation only | | `refactor` | Code refactoring | | `chore` | Maintenance tasks | | `test` | Adding/updating tests | | `perf` | Performance improvement | | `style` | Code style (formatting, semicolons, etc.) |

**Scope Examples:**

- `css` - css`` tagged template helper
- `styled` - styled component system
- `theme` - Theme provider
- `babel` - Babel plugin changes
- `types` - TypeScript type definitions

### 7. Push to Remote

```bash
git push -u origin <branch-name>
```

### 8. Create Pull Request

```bash
gh pr create --title "<type>(<scope>): <description>" --body "$(cat <<'EOF'
## Summary

<1-3 bullet points describing changes>

## Changes

- Change 1
- Change 2

## Test plan

- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes
- [ ] `bun run test` passes

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

---

## Important Notes

- **ALWAYS** run pre-commit checks before committing
- **ALWAYS** include `Co-Authored-By` footer for Claude-assisted commits
- Use `bun` exclusively for all package management
