# Contributing to kstyled

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to kstyled.

## Development Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8 (or bun >= 1.0)
- Git

### Getting Started

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/crossplatformkorea/kstyled.git
   cd kstyled
   ```

2. **Install dependencies**

   Using pnpm (recommended):

   ```bash
   pnpm install
   ```

   Using bun:

   ```bash
   bun install
   ```

3. **Build all packages**

   ```bash
   pnpm build
   # or
   bun run build
   ```

4. **Run the example app**

   ```bash
   pnpm dev
   # or
   bun run dev
   ```

## Project Structure

```sh
kstyled/
├── packages/
│   ├── kstyled/ # Runtime library (styled, ThemeProvider, etc.)
│   ├── babel-plugin-kstyled/ # Babel transformation plugin
│   ├── example/               # Expo example app for testing
│   └── docs/                  # Documentation (Docusaurus)
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── turbo.json                 # Turborepo build pipeline
└── package.json               # Root package.json
```

## Development Workflow

### Making Changes

1. Create a new branch for your feature/fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the appropriate package:
   - Runtime changes: `packages/kstyled/src/`
   - Babel plugin changes: `packages/babel-plugin-kstyled/src/`
   - Example app changes: `packages/example/app/`
   - Documentation: `packages/docs/docs/`

3. Build and test your changes:

   ```bash
   pnpm build
   pnpm typecheck
   pnpm lint
   ```

4. Test in the example app:

   ```bash
   pnpm dev
   ```

### Running the Example App

#### Quick Start

The simplest way to start developing:

```bash
# Start Metro bundler
pnpm dev

# In a new terminal, run the platform you want:
pnpm --filter example android   # Android
pnpm --filter example ios        # iOS (Mac only)
pnpm --filter example web        # Web
```

#### Important: Metro Bundler

**One Metro instance serves all platforms** (Android, iOS, Web). Start Metro once, then connect each platform to it.

```txt
┌─────────────────────────────────┐
│   Metro Bundler (port 8081)     │
└─────────────────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    │         │        │        │
  Android    iOS     Web    ...
```

#### VSCode Development

Use the pre-configured launch tasks:

1. `Cmd+Shift+D` (Run and Debug panel)
2. Select **"Run Android"** or **"Run iOS"** - Metro starts automatically
3. After Metro is running, select **"Run Web"** to open browser (reuses Metro)

#### Port Conflicts

If you get "Port 8081 already in use":

```bash
# Check what's using the port
lsof -i:8081

# Kill the process
lsof -ti:8081 | xargs kill -9

# Restart Metro
pnpm dev
```

### Code Style

- Use TypeScript for all source code
- Follow existing code style (use ESLint)
- Add JSDoc comments for public APIs
- Write descriptive commit messages

### Type Checking

All packages use TypeScript. Run type checking with:

```bash
pnpm typecheck
```

### Linting

We use ESLint for code quality. Run linting with:

```bash
pnpm lint
```

## Testing

### Manual Testing

The example app (`packages/example/`) is the primary way to test changes:

1. Make changes to kstyled or babel-plugin-kstyled
2. Rebuild: `pnpm build`
3. Run example: `pnpm dev`
4. Test your changes in the Expo app

### Adding Test Cases

When adding new features, please add examples to the demo app:

- Add new screens to `packages/example/app/`
- Demonstrate the feature with clear UI
- Add comments explaining the feature

## Pull Request Process

1. **Update documentation** - Update README.md if you're adding new features
2. **Test thoroughly** - Ensure your changes work in the example app
3. **Write clear PR description** - Explain what and why
4. **Link related issues** - Reference any related issue numbers

### PR Title Format

Use conventional commit format:

- `feat: add variants API`
- `fix: resolve theme context issue`
- `docs: update installation guide`
- `perf: optimize style merging`
- `refactor: simplify CSS parser`
- `test: add benchmark tests`

## Package Scripts

### Root Level

- `pnpm build` - Build all packages
- `pnpm dev` - Run example app
- `pnpm typecheck` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all build artifacts

### Package Level

Each package has its own scripts:

```bash
cd packages/kstyled
pnpm build       # Build this package
pnpm typecheck   # Type check
pnpm lint        # Lint
pnpm test        # Run tests (if available)
```

## Turborepo

This project uses Turborepo for build orchestration. Key concepts:

- **Task dependencies** - `build` tasks depend on dependencies being built first
- **Caching** - Build outputs are cached for speed
- **Parallel execution** - Independent tasks run in parallel

## Bun and pnpm Support

Both package managers are fully supported:

### pnpm (Primary)

```bash
pnpm install
pnpm build
pnpm dev
```

### Bun (Alternative)

```bash
bun install
bun run build
bun run dev
```

`pnpm-lock.yaml` is the release lockfile and must stay in sync. Bun is useful for
local development, but release checks and CI use pnpm.

## Release Process

(For maintainers)

### Publishing a New Version

The publish workflow releases the exact version already committed to `main`.
It never edits package versions or creates a release commit.

1. Update every package version together.

   ```bash
   pnpm version:beta     # beta.1 -> beta.2
   pnpm version:release  # 0.4.0-beta.2 -> 0.4.0
   ```

   Use `version:patch`, `version:minor`, or `version:major` only when starting a
   new stable line.

2. Update `CHANGELOG.md`, then run the complete release gate.

   ```bash
   pnpm check
   pnpm publish:dry:beta # use publish:dry for a stable release
   ```

3. Commit the release candidate and push it to `main`.

4. Open the [Publish workflow](https://github.com/crossplatformkorea/kstyled/actions/workflows/publish.yml)
   and run it on `main` with the matching npm tag. Keep `dry_run` enabled for
   the first run.

5. Inspect the dry-run package lists, then run the same workflow with
   `dry_run` disabled. The workflow publishes both packages with npm
   provenance, pushes `v<version>`, and creates a prerelease for beta versions.

6. Verify both packages and dist-tags.

   ```bash
   npm view kstyled@beta version
   npm view babel-plugin-kstyled@beta version
   npm view kstyled dist-tags
   npm view babel-plugin-kstyled dist-tags
   ```

#### Trusted Publishing

Configure npm trusted publishing separately for `kstyled` and
`babel-plugin-kstyled`:

- provider: GitHub Actions
- organization: `crossplatformkorea`
- repository: `kstyled`
- workflow filename: `publish.yml`

The workflow has `id-token: write`, so it does not require an `NPM_TOKEN`.

#### Manual Fallback

Use this only when trusted publishing is unavailable. Run `pnpm check`, confirm
`npm whoami`, and publish each package with the same tag and provenance:

```bash
npm publish --workspace packages/kstyled --access public --tag beta --provenance
npm publish --workspace packages/babel-plugin-kstyled --access public --tag beta --provenance
```

Create and push the matching tag only after both publishes succeed.

### Troubleshooting Publishing

#### "There are no new packages that should be published"

This means the version in package.json already exists on npm. You need to:

1. Bump the version in both packages
2. Commit the version change
3. Try publishing again

#### "ERR_PNPM_GIT_NOT_LATEST"

Your local git history differs from remote. Fetch the remote changes and rebase
the release commit before trying again. Do not bypass this check for a real
publish.

#### "ERR_PNPM_GIT_UNCLEAN"

You have uncommitted changes. Either:

- Commit your changes first
- Or add `--no-git-checks` flag (not recommended)

### Version Guidelines

Follow semantic versioning:

- **Patch** (0.1.x): Bug fixes, small improvements
- **Minor** (0.x.0): New features, non-breaking changes
- **Major** (x.0.0): Breaking changes

Example version history:

- `0.1.0` - Initial release
- `0.1.1` - Bug fixes
- `0.1.2` - Add new feature (backwards compatible)
- `0.2.0` - Add breaking API changes
- `1.0.0` - Stable release

## Troubleshooting

### Metro WebSocket Connection Errors

If you see "WebSocket exception" or "Cannot connect to Metro":

**Common cause**: Port forwarding not set up (Android)

```bash
# Set up port forwarding
adb reverse tcp:8081 tcp:8081

# Verify Metro is running
curl http://localhost:8081/status
# Should return: {"packager":"running"}
```

**If Metro crashed**: Restart with cache clear

```bash
pnpm --filter example start -- --reset-cache
```

### Build Issues

**"Unable to resolve module" errors**:

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build

# Clear Metro cache
cd packages/example
rm -rf .expo node_modules/.cache
pnpm start --clear
```

**Babel transformation not working**:

```bash
# Rebuild babel plugin
cd packages/babel-plugin-kstyled
pnpm build

# Clear example cache
cd ../example
rm -rf .expo
pnpm start --clear
```

### Testing Your Changes

After making changes to `kstyled` or `babel-plugin-kstyled`:

1. **Rebuild the package**:

   ```bash
   pnpm build
   ```

2. **Clear example cache**:

   ```bash
   cd packages/example
   rm -rf .expo
   ```

3. **Restart Metro with clean cache**:

   ```bash
   pnpm start --clear
   ```

4. **Reload the app**: Press `r` in Metro terminal or reload in simulator

### VSCode Debug Configurations

Useful launch configurations in `.vscode/launch.json`:

- **Fix Metro WebSocket Issues** - Auto-fixes port forwarding and Metro connection
- **Start Metro (Reset Cache)** - Starts Metro with clean cache
- **View Android Logs** - Real-time Android logcat filtering

## Questions?

If you have questions, please:

1. Check the [README](README.md)
2. Check the [Documentation](https://crossplatformkorea.github.io/kstyled) (includes Troubleshooting guide)
3. Open a [Discussion](https://github.com/crossplatformkorea/kstyled/discussions)
4. File an [Issue](https://github.com/crossplatformkorea/kstyled/issues)

Thank you for contributing! 🎉
