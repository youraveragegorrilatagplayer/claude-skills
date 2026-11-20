#!/usr/bin/env node
/* Installs this collection into Claude Code on this computer.
     node install.mjs            core skills + core MCP servers (asks for API keys where needed)
     node install.mjs --all      also the extended catalog
   Options: --force (overwrite existing skills/servers)  --yes (no prompts; servers that need a key are skipped)
            --no-mcp  --no-catalog  --home <dir> (install somewhere other than your home folder, for testing)
   Needs: Node 18+, git. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const ALL = flag("--all"), FORCE = flag("--force"), YES = flag("--yes") || !process.stdin.isTTY;
const HOME = opt("--home") || os.homedir();
const claudeDir = path.join(HOME, ".claude");
const skillsDir = path.join(claudeDir, "skills"), agentsDir = path.join(claudeDir, "agents");
fs.mkdirSync(skillsDir, { recursive: true }); fs.mkdirSync(agentsDir, { recursive: true });

const installed = new Set(fs.readdirSync(skillsDir));   // names on disk before we start
const placed = new Set();                               // names placed during this run (first one wins)
const stats = { added: 0, replaced: 0, skipped: 0, repos: 0, failed: [] };
const log = (s) => console.log(s);
const norm = (s) => s.replace(/\r\n/g, "\n").trim();
function skillText(dir) { try { return norm(fs.readFileSync(path.join(dir, "SKILL.md"), "utf8")); } catch { return null; } }
/* A name that's already taken: the same skill again (identical SKILL.md) is skipped; a different skill with the same
   name is kept under name-owner, so nothing in the catalog is lost to a naming clash. */
function freeName(name, src, owner) {
  if (!placed.has(name) && !(installed.has(name) && !FORCE)) return name;
  const theirs = skillText(src), ours = skillText(path.join(skillsDir, name));
  if (theirs && ours && theirs === ours) return null;
  const alt = `${name}-${owner.toLowerCase()}`;
  return placed.has(alt) ? null : alt;
}

function place(src, name, licenceFrom) {
  if (placed.has(name)) return;
  const dest = path.join(skillsDir, name);
  if (installed.has(name) && !FORCE) { stats.skipped++; placed.add(name); return; }
  if (fs.existsSync(dest)) { fs.rmSync(dest, { recursive: true, force: true }); stats.replaced++; } else stats.added++;
  fs.cpSync(src, dest, { recursive: true, filter: (p) => !p.split(path.sep).includes(".git") });
  if (licenceFrom && !fs.readdirSync(dest).some((f) => /^licen[cs]e/i.test(f))) fs.copyFileSync(licenceFrom, path.join(dest, "LICENSE"));
  placed.add(name);
}

/* ---- 1. skills and agents kept in this repo ---- */
log("Skills in this repo:");
for (const d of fs.readdirSync(path.join(here, "skills"), { withFileTypes: true })) if (d.isDirectory()) place(path.join(here, "skills", d.name), d.name);
for (const f of fs.readdirSync(path.join(here, "agents"))) {
  const dest = path.join(agentsDir, f);
  if (!fs.existsSync(dest) || FORCE) fs.copyFileSync(path.join(here, "agents", f), dest);
}
log(`  ${placed.size} skills checked, agents copied`);

/* ---- 2. catalog repos: clone, find every SKILL.md folder, install ---- */
const SKIP_SEG = new Set(["node_modules", ".git", "cli", "template", "templates", "test", "tests", "dist", "build"]);
function findSkills(root, anyHidden = false) {
  const out = [];
  (function walk(dir, rel) {
    let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    if (rel && ents.some((e) => e.isFile() && e.name === "SKILL.md")) { out.push(rel); return; } // nested skills stay inside their parent
    for (const e of ents) {
      if (!e.isDirectory() || SKIP_SEG.has(e.name)) continue;
      // other tools' copies (.cursor, .codex, .agents...) are skipped unless the repo has no other copy
      if (e.name.startsWith(".") && e.name !== ".claude" && !anyHidden) continue;
      walk(path.join(dir, e.name), rel ? rel + "/" + e.name : e.name);
    }
  })(root, "");
  if (fs.existsSync(path.join(root, "SKILL.md"))) out.push("");          // a repo that is itself one skill
  return out.length || anyHidden ? out : findSkills(root, true);
}
function wanted(rel, include) {
  if (!include || !include.length) return true;
  const base = rel.split("/").pop();
  return include.some((i) => i === base || rel === i || rel.startsWith(i + "/"));
}
function skillName(root, rel, repo) {
  if (rel) return rel.split("/").pop();
  const m = /^\s*name:\s*["']?([\w.-]+)/m.exec(fs.readFileSync(path.join(root, "SKILL.md"), "utf8"));
  return m ? m[1] : repo.split("/")[1];
}

const catalog = JSON.parse(fs.readFileSync(path.join(here, "catalog", "skills.json"), "utf8"));
if (!flag("--no-catalog")) {
  const entries = catalog.repos.filter((r) => r.tier === "core" || ALL);
  const byRepo = new Map();
  for (const e of entries) { if (!byRepo.has(e.repo)) byRepo.set(e.repo, []); byRepo.get(e.repo).push(e); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "claude-skills-"));
  log(`\nCatalog (${ALL ? "core + extended" : "core"}): ${byRepo.size} repos`);
  try {
    for (const [repo, list] of byRepo) {
      const dir = path.join(tmp, repo.replace("/", "__"));
      const r = spawnSync("git", ["clone", "--depth", "1", "--quiet", `https://github.com/${repo}.git`, dir], { stdio: "ignore" });
      if (r.status !== 0) { stats.failed.push(repo); log(`  ✗ ${repo} (clone failed)`); continue; }
      stats.repos++;
      const lic = fs.readdirSync(dir).find((f) => /^licen[cs]e/i.test(f));
      // .claude/ copies first, then shorter paths, so the canonical copy of a duplicated skill wins
      const rels = findSkills(dir).sort((a, b) => (b.startsWith(".claude/") - a.startsWith(".claude/")) || a.length - b.length);
      const include = list.some((e) => !e.include) ? null : list.flatMap((e) => e.include);
      let n = 0;
      for (const rel of rels) {
        if (!wanted(rel, include)) continue;
        const src = rel ? path.join(dir, ...rel.split("/")) : dir;
        const name = freeName(skillName(dir, rel, repo), src, repo.split("/")[0]);
        if (!name) { stats.skipped++; continue; }
        place(src, name, lic ? path.join(dir, lic) : null); n++;
      }
      log(`  ✓ ${repo} (${n} skills)`);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

/* ---- 3. MCP servers ---- */
if (!flag("--no-mcp")) {
  const mcp = JSON.parse(fs.readFileSync(path.join(here, "catalog", "mcp.json"), "utf8"));
  const servers = mcp.servers.filter((s) => s.tier === "core" || ALL);
  const rl = YES ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
  // user-scope servers live under mcpServers in ~/.claude.json (what `claude mcp add --scope user` writes);
  // the file is backed up first and every other setting in it is kept
  const cfgPath = path.join(HOME, ".claude.json");
  let cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, "utf8")) : {};
  if (fs.existsSync(cfgPath)) fs.copyFileSync(cfgPath, cfgPath + ".bak-" + Date.now());
  cfg.mcpServers = cfg.mcpServers || {};
  log(`\nMCP servers (added to ${cfgPath}):`);
  for (const s of servers) {
    if (cfg.mcpServers[s.name] && !FORCE) { log(`  · ${s.name} (already set up)`); continue; }
    const vals = {};
    let missing = false;
    for (const [k, label] of Object.entries(s.keys || {})) {
      vals[k] = process.env[k] || (rl ? (await rl.question(`  ${s.name}: ${label} — paste it, or press Enter to skip: `)).trim() : "");
      if (!vals[k]) missing = true;
    }
    if (missing) { log(`  - ${s.name} skipped (no key)`); continue; }
    for (const [k, label] of Object.entries(s.optional_keys || {}))
      vals[k] = process.env[k] || (rl ? (await rl.question(`  ${s.name}: ${label} — paste it, or press Enter to skip: `)).trim() : "");
    const conf = JSON.parse(JSON.stringify(s.config));
    for (const [k, extra] of Object.entries(s.key_args || {})) if (vals[k]) conf.args = [...conf.args, ...extra];
    const fill = (v) => v.replace(/\$\{(\w+)\}/g, (_, k) => vals[k] || "");
    if (conf.args) conf.args = conf.args.map(fill);
    if (conf.env) for (const k of Object.keys(conf.env)) conf.env[k] = fill(conf.env[k]);
    cfg.mcpServers[s.name] = conf; log(`  ✓ ${s.name}`);
  }
  if (rl) rl.close();
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
}

log(`\nDone: ${stats.added} skills added, ${stats.replaced} replaced, ${stats.skipped} already there, from ${stats.repos} repos` +
    (stats.failed.length ? `; failed: ${stats.failed.join(", ")}` : "") + ".");
log("Start a new Claude Code session to load them. Hosted MCP servers (figma, vercel) ask you to sign in via /mcp the first time.");
