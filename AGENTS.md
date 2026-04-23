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
portal/                    # Query SQD Portal across 210+ chains
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

- **Keep SKILL.md under 500 lines** — put detail in `references/`.
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
# All skills
npx skills add subsquid-labs/agent-skills --all

# Individual
npx skills add subsquid-labs/agent-skills/pipes-sdk
npx skills add subsquid-labs/agent-skills/portal
npx skills add subsquid-labs/agent-skills/squid-sdk/squid-perf
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

All Pipes-related skills use `npx @iankressin/pipes-cli@latest` for project generation. Skills should:

- Use the published npm package (not local SDK paths)
- Reference `beta.docs.sqd.dev` for documentation
- Follow the research workflow in `pipes-sdk/references/RESEARCH_CHECKLIST.md`

## Validation

Use the [skills-ref](https://github.com/agentskills/agentskills/tree/main/skills-ref) library to validate a skill:

```bash
skills-ref validate ./{skill-name}
```

This checks that `SKILL.md` frontmatter is valid and follows naming conventions.
