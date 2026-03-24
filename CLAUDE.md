# Claude Code Rules

## Git

- Never add `Co-Authored-By` to commits
- Keep commit messages concise — one line unless the change is complex
- Don't commit node_modules, .env files, or build artifacts

## Efficiency

- If a web search fails twice for the same info, stop and ask the user
- Block explorers (Etherscan, BaseScan) return 403 to automated requests — don't retry, give the user the URL instead
- If you need info the user can provide faster (deployment blocks, config values), just ask
- 2 failed attempts = stop and pivot. Don't exhaust every variation.

## Skills

This repo contains 3 skills across 2 products:

| Skill | Product | Path |
|-------|---------|------|
| pipes-new-indexer | Pipes SDK | `pipes-sdk/pipes-new-indexer/` |
| pipes-troubleshooting | Pipes SDK | `pipes-sdk/pipes-troubleshooting/` |
| portal-query | Portal | `portal/portal-query/` |

When editing skills:
- Keep SKILL.md under 500 lines — put detailed content in `references/`
- The `description` field in YAML frontmatter is what agents see at startup — make it specific
- Test that markdown links to reference files resolve correctly
- Portal dataset names ≠ common chain names (e.g., `arbitrum-one` not `arbitrum`). See `portal/portal-query/references/dataset-mapping.md`

## Known CLI Bugs (Pipes SDK)

These affect `@iankressin/pipes-cli` and are documented in the pipes-new-indexer skill:

1. **ora ESM/CJS crash** — `init` crashes with `import_ora` error. Workaround: patch the cached bundle (see skill)
2. **Factory address dropped** — `uniswapV3Swaps` template silently drops `factoryAddress`. Fix: manually edit `src/index.ts` after generation
3. **Sync table error on first run** — harmless `Unknown table 'pipes.sync'` error. SDK creates the table and continues.

## Node.js

Use LTS (v20 or v22). Node v25.x has zstd bugs that crash during Portal data streaming.

## Testing Indexers

Don't declare success until you verify actual data in the database:
1. Start the indexer
2. Wait 30 seconds
3. Query ClickHouse for row count — must be > 0
4. Inspect sample data for correctness
5. If zero data: check contract address, start block, proxy pattern, event names
