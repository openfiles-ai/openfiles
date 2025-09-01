# OpenFiles SDK Release Process

This document outlines the release process for OpenFiles SDKs (TypeScript and Python).

## Prerequisites

- **NPM Access**: Login to npm with publish rights to `@openfiles-ai/sdk`
- **PyPI Access**: Configure PyPI token for `openfiles-ai` package
- **Git Access**: Push rights to the main repository
- **Clean Working Directory**: No uncommitted changes

## Release Commands

### 🚀 Full Release (Recommended)

```bash
# Complete release process for both SDKs
pnpm release
```

This command will:
1. Run CI checks (build, test, lint)
2. Update versions using changesets
3. Publish TypeScript SDK to NPM
4. Publish Python SDK to PyPI
5. Push changes and tags to GitHub

### 🧪 Dry Run (Test Release)

```bash
# Test the release without publishing
pnpm release:dry
```

### 📝 Manual Step-by-Step Process

#### Step 1: Create a Changeset

```bash
pnpm changeset
```

- Select packages that changed
- Choose version bump type (patch/minor/major)
- Write a description of changes

#### Step 2: Version Packages

```bash
pnpm release:version
```

- Updates package versions
- Generates CHANGELOG entries
- Creates version commit

#### Step 3: Publish Packages

```bash
pnpm release:publish
```

- Publishes TypeScript SDK to NPM
- Publishes Python SDK to PyPI
- Creates git tags

#### Step 4: Push to GitHub

```bash
pnpm release:push
```

- Pushes commits to main branch
- Pushes version tags

## Version Strategy

### Semantic Versioning

- **Patch** (0.0.X): Bug fixes, small improvements
- **Minor** (0.X.0): New features, backward compatible
- **Major** (X.0.0): Breaking changes

### Examples

```bash
# Bug fix release (patch)
pnpm changeset
# Select: @openfiles-ai/sdk
# Select: patch
# Message: "Fix recursive parameter handling in list_files"

# New feature release (minor)  
pnpm changeset
# Select: @openfiles-ai/sdk
# Select: minor
# Message: "Add support for file encryption"

# Breaking change (major)
pnpm changeset
# Select: @openfiles-ai/sdk
# Select: major
# Message: "BREAKING: Change API response format"
```

## CI/CD Integration

GitHub Actions will automatically:
1. Run tests on pull requests
2. Publish releases when changesets are merged to main
3. Update changelogs

## Troubleshooting

### NPM Publishing Issues

```bash
# Check NPM login
npm whoami

# Login if needed
npm login

# Verify package access
npm access ls-packages
```

### PyPI Publishing Issues

```bash
# Check Poetry configuration
poetry config list

# Configure PyPI token
poetry config pypi-token.pypi <your-token>

# Test PyPI upload
pnpm release:dry:py
```

### Git Issues

```bash
# Ensure clean working directory
git status

# Reset if needed
git reset --hard HEAD

# Fetch latest tags
git fetch --tags
```

## Environment Variables

For automated releases, set these environment variables:

```bash
# NPM Token (for CI/CD)
NPM_TOKEN=npm_...

# PyPI Token (for CI/CD)
PYPI_TOKEN=pypi-...

# GitHub Token (for changelog generation)
GITHUB_TOKEN=ghp_...
```

## Best Practices

1. **Always run dry-run first**: `pnpm release:dry`
2. **Review changesets**: Check `.changeset/*.md` files before releasing
3. **Test locally**: Run `pnpm ci` before releasing
4. **Coordinate releases**: Release both SDKs together when possible
5. **Document breaking changes**: Use clear changeset messages
6. **Tag important releases**: Create GitHub releases for major versions

## Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm release` | Complete release process |
| `pnpm release:dry` | Test release without publishing |
| `pnpm changeset` | Create a new changeset |
| `pnpm changeset:status` | Check pending changesets |
| `pnpm release:version` | Update versions only |
| `pnpm release:publish` | Publish packages only |
| `pnpm release:push` | Push changes to GitHub |
| `pnpm ci` | Run all checks |

## Support

For issues with the release process:
1. Check this documentation
2. Review GitHub Actions logs
3. Contact the maintainers

---

Last updated: 2025-01-09