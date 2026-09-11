#!/usr/bin/env node
// Enforces incremental skill versions. A skill whose files changed since the
// base ref must move `metadata.version` by exactly one patch step
// (1.6.1 -> 1.6.2), and a skill whose files did not change keeps its version.
// Minor and major steps need an explicit --allow, which the pull request
// workflow derives from a `version:minor` or `version:major` label.
//
// Usage: node .github/scripts/check-skill-versions.mjs <base-ref> [--allow patch|minor|major]
//   e.g. node .github/scripts/check-skill-versions.mjs origin/main
//
// The working tree is compared against the merge base of <base-ref> and HEAD,
// so uncommitted edits count. Untracked files count too.

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP = new Set(['.git', '.github', 'node_modules']);
const STEPS = ['patch', 'minor', 'major'];

function subdirs(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !SKIP.has(e.name))
    .map((e) => e.name);
}

function hasSkill(dir) {
  try {
    return statSync(join(dir, 'SKILL.md')).isFile();
  } catch {
    return false;
  }
}

// Skills sit at depth 1 (portal/) or depth 2 (squid-sdk/squid-perf/).
function findSkillDirs(root) {
  const found = [];
  for (const top of subdirs(root)) {
    if (hasSkill(join(root, top))) {
      found.push(top);
      continue;
    }
    for (const nested of subdirs(join(root, top))) {
      if (hasSkill(join(root, top, nested))) found.push(`${top}/${nested}`);
    }
  }
  return found.sort();
}

// Reads metadata.version from SKILL.md frontmatter without a YAML dependency;
// only indented lines inside the `metadata:` block are considered.
export function readVersion(text) {
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!block) return null;
  let inMetadata = false;
  for (const line of block[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      inMetadata = /^metadata:\s*$/.test(line);
      continue;
    }
    if (!inMetadata) continue;
    const kv = line.match(/^\s+version:\s*(.+)$/);
    if (kv) return kv[1].trim().replace(/^["'](.*)["']$/, '$1').trim();
  }
  return null;
}

export function parseVersion(value) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(value ?? '');
  return m ? m.slice(1).map(Number) : null;
}

// Returns null when the transition is allowed, otherwise the reason it is not.
export function checkTransition(base, next, changed, allow = 'patch') {
  if (base === null) return null; // new skill: any starting version
  const b = parseVersion(base);
  const n = parseVersion(next);
  if (!b) return `base version ${base} is not MAJOR.MINOR.PATCH`;
  if (!n) return `version ${next ?? '(missing)'} is not MAJOR.MINOR.PATCH`;

  const same = base === next;
  const patchStep = `${b[0]}.${b[1]}.${b[2] + 1}`;
  if (!changed) {
    return same ? null : `version moved ${base} -> ${next} but no file under the skill changed`;
  }

  const isPatch = n[0] === b[0] && n[1] === b[1] && n[2] === b[2] + 1;
  const isMinor = n[0] === b[0] && n[1] === b[1] + 1 && n[2] === 0;
  const isMajor = n[0] === b[0] + 1 && n[1] === 0 && n[2] === 0;
  if (isPatch) return null;
  if (isMinor && (allow === 'minor' || allow === 'major')) return null;
  if (isMajor && allow === 'major') return null;
  if (same) return `files changed but version stayed at ${base}; bump it to ${patchStep}`;
  const hint = isMinor
    ? ' (a minor step needs the version:minor label)'
    : isMajor
      ? ' (a major step needs the version:major label)'
      : '';
  return `version moved ${base} -> ${next}; the allowed step is ${patchStep}${hint}`;
}

function main() {
  const args = process.argv.slice(2);
  const baseRef = args.find((a) => !a.startsWith('--'));
  const allowIdx = args.indexOf('--allow');
  const allow = allowIdx === -1 ? 'patch' : args[allowIdx + 1];
  if (!baseRef || !STEPS.includes(allow)) {
    console.error('usage: check-skill-versions.mjs <base-ref> [--allow patch|minor|major]');
    process.exit(2);
  }

  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const git = (...gitArgs) => execFileSync('git', gitArgs, { cwd: root, encoding: 'utf8' }).trim();
  const mergeBase = git('merge-base', baseRef, 'HEAD');

  const problems = [];
  for (const dir of findSkillDirs(root)) {
    const skillFile = `${dir}/SKILL.md`;
    const next = readVersion(readFileSync(join(root, skillFile), 'utf8'));
    let base = null;
    try {
      base = readVersion(git('show', `${mergeBase}:${skillFile}`));
    } catch {
      base = null; // not in the base ref: a new skill
    }
    const changed =
      git('diff', '--name-only', mergeBase, '--', dir) !== '' ||
      git('ls-files', '--others', '--exclude-standard', '--', dir) !== '';
    const problem = checkTransition(base, next, changed, allow);
    if (problem) {
      problems.push(`${dir}: ${problem}`);
    } else {
      console.log(`ok  ${dir}: ${base ?? 'new'} -> ${next}${changed ? '' : ' (no changes)'}`);
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) console.error(`error: ${problem}`);
    console.error('Skill versions move by one patch step per pull request; see the Releases section of AGENTS.md.');
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
