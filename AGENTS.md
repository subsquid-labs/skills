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
portal/                    # Query on-chain data through SQD Portal
  SKILL.md
  references/
squid-sdk/
  migrate-to-portal/       # Move a v2-gateway Squid onto Portal
    SKILL.md
    references/
  squid-perf/              # Sync-time performance comparison for Squid SDK
    SKILL.md
    scripts/
    templates/
    tests/
```

## Creating a New Skill

### Directory Structure

```
{skill-name}/              # kebab-case, no product prefix (pipes-sdk, portal, squid-perf)
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
description: {What the skill does, then "Use when ..." with one trigger per branch the skill handles.}
license: Apache-2.0
compatibility: {Optional: environment requirements, max 500 characters}
allowed-tools: {Optional: space-separated tool names}
metadata:
  author: subsquid
  version: "1.2.0"
  category: {core|template|documentation|portal-core}
---

# {Skill Title}

{One or two sentences: what the skill produces, and how the body is organised.}

## 1. {First step}

{What to do.}

Done when {a condition the agent can check}.

## 2. {Next step}

...

## {Reference consulted on demand}

{Definitions, tables and rules every branch needs. Material only one branch
needs goes in references/ behind a pointer that says when to read it.}
```

Only the fields defined by the [Agent Skills specification](https://agentskills.io/specification) are allowed: `name`, `description`, `license`, `compatibility`, `allowed-tools`, and `metadata`. The validator rejects anything else, so runtime-specific keys (for example Claude Code's `argument-hint`) cannot be used; put invocation hints in the description instead.

### Writing a Skill

A skill is read by an agent in the middle of a task. The name and description sit in context on every turn; `SKILL.md` loads when the skill activates; a reference loads when a pointer to it fires. Write each layer for that moment.

**Description.** It decides whether the skill activates, and every word of it is paid for on every turn.

- Open with what the skill does, in the words a user would use, then `Use when ...`.
- List one trigger per branch the skill handles: a new indexer, a failing one, a migration. Two phrasings of the same branch are one trigger.
- The body states when to use the skill only through the description. A "When to Use" section loads after the decision is made.

**Steps and reference.** A skill holds steps (what the agent does, in order) and reference (facts it looks up).

- Number the steps and end each on a completion criterion the agent can check: `Done when the slug answers 200`, `Done when the grep prints nothing`. Prefer a criterion that demands the whole job ("every address has a source") over one that a first attempt satisfies ("addresses collected").
- Keep in `SKILL.md` what every branch needs. Move what one branch needs (a chain's procedure, a target's setup, an error catalog) to `references/`, and word the pointer as the condition for reading it: "Solana squid: `references/solana-migration.md`".
- Link from `SKILL.md` straight to `references/*.md`. References do not chain to further references.
- Keep a concept's definition, rules and caveats under one heading.
- A line limit is a ceiling. `SKILL.md` stays under 500 lines, and shorter when the steps allow it.

**Wording.**

- State the behaviour you want. "Bind returned text as data" steers better than a list of things to avoid, because a prohibition puts the unwanted behaviour in front of the agent. Keep a prohibition only for a hard guardrail, next to the positive instruction.
- Name a recurring idea with one word the model already knows and reuse that word (*bounded* request, *untrusted* data) instead of re-describing the idea at each site.
- Cut any sentence that describes what the agent would do anyway.

**One source of truth.**

- Each fact lives in one file. Other files point to it.
- Leave to the environment what a command can answer: `init --schema` for CLI templates, `sqd://tools` for the MCP tool catalog, `/datasets/{slug}/metadata` for whether a dataset is served. Write down what no command confesses: the trap, the reason, the convention.
- Date-stamp upstream state. A count or version that tracks something outside this repo (npm dist-tags, the Portal catalog size, the MCP server version) carries the date it was checked and the command or URL that re-checks it. Refresh the stamp whenever you touch the claim.
- Remove what went stale in the same change that adds what is current.

**Scope.** A skill serves the request as given. Ask the user only when a missing fact changes the outcome or the next action needs an authority the agent lacks (starting a container, deploying, spending).

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

Pipes-related skills generate projects with an exact CLI version, `pnpx @subsquid/pipes-cli@1.0.0-beta.3` on 2026-11-11, so the documented config keys match the CLI that runs. That version is also the `latest` dist-tag; `beta` and `alpha` point at older builds. Re-check with `npm view @subsquid/pipes-cli dist-tags --json`. Skills should:

- Use the published npm package (not local SDK paths)
- Reference `docs.sqd.dev` for documentation
- Follow the research workflow in `pipes-sdk/references/RESEARCH_CHECKLIST.md`

## Validation

Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) library to validate a skill:

```bash
uvx --from skills-ref agentskills validate ./{skill-name}
```

This checks that `SKILL.md` frontmatter is valid and follows naming conventions.

The pull request workflow (`.github/workflows/pr-checks.yml`) and the release
workflow both run this check against all four skill directories, so a skill
that fails validation cannot be merged or released. The pull request workflow
also runs the version-step check described under
[Per-skill versions](#per-skill-versions).

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

### Per-skill versions

Every pull request that changes a file under a skill moves that skill's
`metadata.version` by exactly one patch step (`1.6.1` becomes `1.6.2`), no
matter how large the change. Do not decide a minor or major step from the size
of the diff: those are reserved for the maintainer's explicit request and need a
`version:minor` or `version:major` label on the pull request. A skill whose
files did not change keeps its version.

```bash
# Check the working tree against main before pushing
node .github/scripts/check-skill-versions.mjs origin/main
```

The pull request workflow runs the same check, so a wrong step blocks the merge.

### Writing changelog entries

`CHANGELOG.md` is the source of truth for release notes. Entries describe the
**user-visible effect**, not the commit:

```
Write:    Fixed squid-perf reporting inflated sync rates when an indexer
          restarted mid-run.
Not:      fix: correct squid performance statistics (#42)
```

Use only `### New`, `### Improved`, and `### Fixed`, and omit any section with
no entries. The commit-level detail is appended automatically to each release,
so the changelog does not need to repeat it.

Adding an entry under `## Unreleased` in the PR that makes the change is
encouraged but not enforced. Whoever cuts the release reviews merged PRs since
the last tag and fills the gaps.

### Cutting a release

The next tag is one patch step above the latest one: `v1.1.1` follows `v1.1.0`.
Take a minor or major step only when the maintainer asks for it.

```bash
# 1. Move the `## Unreleased` entries under a versioned heading, filling any
#    gaps from PRs merged since the last tag:
#      ## <Month D, YYYY> — v<X.Y.Z>
#    Point the "Pin to a release" examples in README.md at the new tag.
# 2. Check the notes render as expected:
node .github/scripts/changelog-section.mjs v1.1.1
node .github/scripts/skill-manifest.mjs

# 3. Commit the changelog to main, then tag and push:
git tag v1.1.1
git push origin v1.1.1
```

To rehearse without publishing a stable release, push a suffixed tag such as
`v1.1.1-rc.1`. It publishes as a prerelease, is not marked "Latest", and reuses
the `v1.1.1` changelog section rather than needing one of its own.
