# OpenFiles SDK Release Process

This document outlines the **decentralized release process** for OpenFiles SDKs (TypeScript and Python). Each SDK manages its own releases independently, following industry best practices.

## Prerequisites

- **NPM Access**: Login to npm with publish rights to `@openfiles-ai/sdk`
- **PyPI Access**: Configure PyPI token for `openfiles-ai` package
- **Git Access**: Push rights to the main repository
- **Clean Working Directory**: No uncommitted changes

## 🚀 TypeScript SDK Release (`sdks/typescript/`)

### 🎯 Complete Release (Recommended)
```bash
cd sdks/typescript
pnpm release  # changeset → version → publish → push
```

### ⚛️ Atomic Steps
```bash
cd sdks/typescript

# Step 1: Create changeset
pnpm release:changeset

# Step 2: Update version
pnpm release:version

# Step 3: Build and publish 
pnpm release:publish

# Step 4: Push to git
pnpm release:push

# Check status anytime
pnpm release:status
```

### 🧪 Testing
```bash
cd sdks/typescript
pnpm release:dry  # Test publish without releasing
```

## 🐍 Python SDK Release (`sdks/python/`)

### 🎯 Complete Release

**Patch Release (Bug fixes):**
```bash
cd sdks/python
pnpm release  # version patch → build → publish → push
```

**Minor Release (New features):**
```bash
cd sdks/python
pnpm release:minor  # version minor → build → publish → push
```

**Major Release (Breaking changes):**
```bash
cd sdks/python
pnpm release:major  # version major → build → publish → push
```

### ⚛️ Atomic Steps
```bash
cd sdks/python

# Step 1: Update version
pnpm release:version:patch   # or :minor or :major
pnpm release:version:minor
pnpm release:version:major

# Step 2: Build package
pnpm release:build

# Step 3: Publish to PyPI
pnpm release:publish

# Step 4: Commit version and push
pnpm release:push

# Check current version
pnpm release:status
```

### 🧪 Testing
```bash
cd sdks/python
pnpm release:dry  # Test publish without releasing
```

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