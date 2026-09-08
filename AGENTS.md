# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, etc.) when working with code in this repository.

## Repository Overview

A collection of skills for AI coding agents working with SQD products. Skills extend agent capabilities for building blockchain indexers (Pipes SDK) and querying on-chain data (Portal).

## Current Structure

Skills live at the repo root. The skill directory name matches the skill's frontmatter `name`.

```
pipes-sdk/                 # Build, deploy, troubleshoot Pipes SDK indexers
  SKILL.md
  references/
portal/                    # Query SQD Portal across 140+ networks
  SKILL.md
  references/
squid-sdk/
  squid-perf/              # Sync-time performance comparison for Squid SDK
    SKILL.md
    scripts/
    templates/
```

## Creating a New Skill

### Directory Structure

```
{skill-name}/              # kebab-case with product prefix (e.g., sqd-*)
  SKILL.md                 # Required: skill definition
  scripts/                 # Optional: executable scripts
  references/              # Optional: supporting documentation
  templates/               # Optional: HTML/text templates
```

### Naming Conventions

- **Skill directory and `name` field:** `kebab-case` (`pipes-sdk`, `portal`, `squid-perf`). They must match.
- **SKILL.md:** always uppercase, always this exact filename.
- **Scripts:** `kebab-case.sh` (e.g., `setup-database.sh`, `fetch-logs.sh`).

### SKILL.md Format

```markdown
---
name: {skill-name}
description: {One sentence describing what the skill does and when to use it. This is what the agent sees at startup — be specific about activation.}
compatibility: {Optional: environment requirements}
allowed-tools: [{Optional: tool names}]
metadata:
  author: subsquid
  version: "1.2.0"
  category: {core|template|documentation|portal-core}
---

# {Skill Title}

{Brief description of what the skill does.}

## When to Use This Skill

{Describe activation scenarios with concrete phrases the user might say.}

## {Workflow / Reference sections}

{Body content — keep under 500 lines; link heavily to references/}

## Related

- {Pointers to sibling skills}
```

### Best Practices for Context Efficiency

Only the skill name and description load at agent startup. The full `SKILL.md` loads into context when the skill is activated.

- **Keep discovery concise.** Use a short capability statement and a discriminating trigger; avoid keyword inventories or universal activation.
- **Route conditional detail.** Keep essential constraints in `SKILL.md`; place chain-specific procedures, schemas, and substantial examples in references loaded only when needed. A line limit is an upper bound, not a target.
- **Preserve the requested outcome.** Do not add a mandatory interview or approval stage to a scoped implementation. Ask only when missing information materially changes the outcome or the next action requires unresolved authority.
- **Write specific descriptions** — the agent decides when to activate based on this line.
- **Progressive disclosure** — link to reference files that get read only when needed.
- **File references work one level deep** — link directly from SKILL.md to `references/*.md`.

### Script Requirements

- Use `#!/bin/bash` shebang
- Use `set -e` for fail-fast behavior
- Write status messages to stderr: `echo "Message" >&2`
- Write machine-readable output (JSON) to stdout
- Include a cleanup trap for temp files
- Make scripts executable: `chmod +x scripts/*.sh`

### End-User Installation

```bash
# All skills (--full-depth is required: two skills nest under squid-sdk/)
npx skills add subsquid-labs/skills --all --full-depth

# Individual
npx skills add subsquid-labs/skills/pipes-sdk
npx skills add subsquid-labs/skills/portal
npx skills add subsquid-labs/skills/squid-sdk/squid-perf
```

### Required MCP Servers (Optional)

Some skills benefit from MCP servers (configured in `.claude/settings.json` at the project level, not within individual skills):

- **ClickHouse MCP** — for `pipes-sdk` (local Docker deployment)
- **ClickHouse Cloud MCP** — for `pipes-sdk` (ClickHouse Cloud deployment)
- **Railway MCP** — for production deployment via Railway

## Skill Categories

- **Core** — full indexer development lifecycle (creation, debugging, deployment, validation).
- **Portal-core** — query and discovery skills for the SQD Portal.
- **Template** — production-ready templates for common patterns (DEX swaps, NFT transfers, lending).
- **Documentation** — workflow guides and pattern docs; typically live as reference files inside a core skill.

## Integration with Pipes SDK

All Pipes-related skills use `pnpx @subsquid/pipes-cli@1.0.0-beta.2` for project generation (`@latest` is stale — always pin the version or use the `beta` dist-tag). Skills should:

- Use the published npm package (not local SDK paths)
- Reference `docs.sqd.dev` for documentation
- Follow the research workflow in `pipes-sdk/references/RESEARCH_CHECKLIST.md`

## Validation

Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) library to validate a skill:

```bash
uvx --from skills-ref agentskills validate ./{skill-name}
```

This checks that `SKILL.md` frontmatter is valid and follows naming conventions.

The release workflow runs this same check against all four skill directories, so
a skill that fails validation cannot ship in a release.

## Releases

Releases are cut from repo-wide semver tags (`vMAJOR.MINOR.PATCH`). Pushing a
`v*` tag triggers `.github/workflows/release.yml`, which validates every skill,
builds the release notes, attaches a `sqd-skills.tar.gz` bundle, and publishes.

### What each level means

This is a skills repo rather than a library, so the levels are defined in terms
of what breaks for someone who has already installed:

- **MAJOR** — a skill is removed or renamed, or an install path changes. Breaks
  existing install commands and pinned refs.
- **MINOR** — a new skill, or substantive new capability in an existing one.
- **PATCH** — corrections, refreshes tracking upstream SQD API changes, doc
  fixes. Most changes are this.

Repo tags are independent of the per-skill `metadata.version` in each
`SKILL.md`. Both keep moving; each release body carries a generated table of the
skill versions it contains, so the two never have to be reconciled by hand.

### Writing changelog entries

`CHANGELOG.md` is the source of truth for release notes. Entries describe the
**user-visible effect**, not the commit:

```
✅ Fixed squid-perf reporting inflated sync rates when an indexer restarted
   mid-run.
❌ fix: correct squid performance statistics (#42)
```

Use only `### New`, `### Improved`, and `### Fixed`, and omit any section with
no entries. The commit-level detail is appended automatically to each release,
so the changelog does not need to repeat it.

Adding an entry under `## Unreleased` in the PR that makes the change is
encouraged but not enforced. Whoever cuts the release reviews merged PRs since
the last tag and fills the gaps.

### Cutting a release

```bash
# 1. Move the `## Unreleased` entries under a versioned heading, filling any
#    gaps from PRs merged since the last tag:
#      ## <Month D, YYYY> — v<X.Y.Z>
# 2. Check the notes render as expected:
node .github/scripts/changelog-section.mjs v1.2.0
node .github/scripts/skill-manifest.mjs

# 3. Commit the changelog to main, then tag and push:
git tag v1.2.0
git push origin v1.2.0
```

To rehearse without publishing a stable release, push a suffixed tag such as
`v1.2.0-rc.1`. It publishes as a prerelease, is not marked "Latest", and reuses
the `v1.2.0` changelog section rather than needing one of its own.
