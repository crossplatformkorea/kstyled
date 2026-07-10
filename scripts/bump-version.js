#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const bumpType = args.find((argument) => !argument.startsWith('--')) || 'patch';
const dryRun = args.includes('--dry-run');
const packagesDir = path.join(__dirname, '..', 'packages');
const supportedBumpTypes = ['beta', 'release', 'patch', 'minor', 'major'];

if (!supportedBumpTypes.includes(bumpType)) {
  throw new Error(
    `Unsupported bump type: ${bumpType}. ` +
      `Expected one of: ${supportedBumpTypes.join(', ')}`
  );
}

function incrementVersion(version, type) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/);
  if (!match) {
    throw new Error(`Unsupported version: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4];
  const prereleaseNumber = match[5] ? Number(match[5]) : 0;

  switch (type) {
    case 'beta':
      return prerelease === 'beta'
        ? `${major}.${minor}.${patch}-beta.${prereleaseNumber + 1}`
        : `${major}.${minor + 1}.0-beta.1`;
    case 'release':
      return prerelease ? `${major}.${minor}.${patch}` : version;
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return prerelease
        ? `${major}.${minor}.${patch}`
        : `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unsupported bump type: ${type}`);
  }
}

const packages = fs
  .readdirSync(packagesDir)
  .map((name) => path.join(packagesDir, name, 'package.json'))
  .filter((packageJsonPath) => fs.existsSync(packageJsonPath))
  .map((packageJsonPath) => ({
    packageJsonPath,
    packageJson: JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')),
  }))
  .filter(({ packageJson }) => packageJson.name !== 'kstyled-docs');

const versions = new Set(
  packages.map(({ packageJson }) => packageJson.version)
);
if (versions.size !== 1) {
  throw new Error(
    `Package versions are out of sync: ${Array.from(versions).join(', ')}`
  );
}

const oldVersion = packages[0]?.packageJson.version;
if (!oldVersion) {
  throw new Error('No versioned packages found');
}

const newVersion = incrementVersion(oldVersion, bumpType);

console.log(`Bumping ${bumpType} version for all packages...\n`);

for (const { packageJsonPath, packageJson } of packages) {
  packageJson.version = newVersion;
  if (!dryRun) {
    fs.writeFileSync(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
      'utf8'
    );
  }
  console.log(`${packageJson.name}: ${oldVersion} -> ${newVersion}`);
}

if (dryRun) {
  console.log('\nDry run: no files were changed.');
}

console.log(`\nNew version: ${newVersion}`);
