const env = process.env;

const isDryRun = ['1', 'true'].includes(env.npm_config_dry_run);
const isReleaseWorkflow =
  env.CI === 'true' &&
  env.GITHUB_ACTIONS === 'true' &&
  env.GITHUB_EVENT_NAME === 'workflow_dispatch' &&
  env.GITHUB_REPOSITORY === 'crossplatformkorea/kstyled' &&
  env.GITHUB_REF === 'refs/heads/main' &&
  env.GITHUB_WORKFLOW_REF?.startsWith(
    'crossplatformkorea/kstyled/.github/workflows/publish.yml@',
  );

if (!isDryRun && !isReleaseWorkflow) {
  console.error(
    'Publishing is restricted to the main-branch GitHub Actions Publish workflow.',
  );
  process.exit(1);
}
