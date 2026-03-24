# Contributing

Contributions to improve existing skills or add new skills are welcome.

## Adding a New Skill

### 1. Create the skill directory

```bash
mkdir -p {product}/{skill-name}
# Examples:
#   pipes-sdk/pipes-new-feature
#   portal/portal-new-feature
```

Use `kebab-case` with a product prefix (`pipes-`, `portal-`, etc.) for the directory name.

### 2. Create SKILL.md

Follow this template:

```markdown
---
name: {skill-name}
description: {One sentence describing what the skill does}
compatibility: {Optional: environment requirements}
allowed-tools: [{Optional: space-delimited list}]
metadata:
  author: subsquid
  version: "1.0.0"
  category: {core|template|documentation}
---

# {Product}: {Skill Title}

{Brief description}

## When to Use This Skill

{Describe activation scenarios}

## {Additional sections as needed}

## Related Documentation

- [{reference}](references/{reference}.md) - Description
```

### 3. Choose the correct category

- **core**: Main operational skills (creation, debugging, querying, deployment)
- **template**: Code templates for common patterns
- **documentation**: Workflow guides and best practices

### 4. Add optional directories

- `scripts/` - Executable helper scripts
- `references/` - Supporting documentation

### 5. Update README.md

Add your skill to the relevant product README (`pipes-sdk/README.md` or `portal/README.md`).

### 6. Validate

```bash
# Check YAML frontmatter
head -20 {product}/{skill-name}/SKILL.md

# Validate with skills-ref (if available)
skills-ref validate ./{product}/{skill-name}
```

## Guidelines

### Keep Skills Focused

Each skill should cover one product area well. Use `references/` files for detailed content to keep SKILL.md under 500 lines.

### Progressive Disclosure

Keep SKILL.md under 500 lines. Put detailed reference material in separate files in the `references/` directory.

### Use Clear Descriptions

The description field is loaded at startup for all skills. Make it specific and include trigger phrases that help agents know when to use the skill.

### Follow Naming Conventions

- Directories: `kebab-case` with product prefix (`pipes-`, `portal-`)
- Files: `SKILL.md` (uppercase)
- Scripts: `kebab-case.sh`

### Test Your Skill

Before submitting, test that:
- YAML frontmatter is valid
- All file references work
- Scripts are executable and have proper shebangs
- The skill activates correctly when relevant tasks are detected

## Resources

- [Agent Skills Format](https://agentskills.io/)
- [AGENTS.md](AGENTS.md) - Detailed guidance for AI agents
- [Pipes SDK](https://github.com/subsquid-labs/pipes-sdk)
- [SQD Documentation](https://beta.docs.sqd.dev)

## Questions?

For questions about contributing, open an issue or reach out to the SQD team via Telegram (https://t.me/hydradevs).
