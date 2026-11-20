# My Claude skills

Everything I use to make Awwwards-level websites with Claude Code: my own skills and agents, plus a researched
catalog of the best web-design skills and MCP servers on GitHub. One command sets it all up on a new computer.

## Install on a new computer

You need **Git** and **Node 18+**, and to be signed in to GitHub (this repo is private).

**Windows (PowerShell):**

```powershell
git clone https://github.com/youraveragegorrilatagplayer/claude-skills.git $HOME\claude-skills
powershell -ExecutionPolicy Bypass -File $HOME\claude-skills\install.ps1
```

**macOS / Linux:**

```bash
git clone https://github.com/youraveragegorrilatagplayer/claude-skills.git ~/claude-skills
bash ~/claude-skills/install.sh
```

Then start a new Claude Code session.

**Or hand it to Claude:** paste this repo's URL and say *"install my skills from this repo"*.

### Options

| Option | What it does |
|---|---|
| *(none)* | core: ~143 skills + 10 MCP servers |
| `--all` | everything: ~470 skills + 12 MCP servers |
| `--force` | overwrite skills and servers that already exist |
| `--yes` | no prompts (MCP servers that need an API key are skipped) |
| `--no-mcp` / `--no-catalog` | skip the MCP servers / the GitHub catalog |

API keys are asked for during install and written only to your local Claude config, never to this repo.

## What's in here

| Path | What |
|---|---|
| `skills/` | 32 of my own skills, copied as-is |
| `agents/` | 5 agents (the Impeccable reviewers) |
| `catalog/skills.json` | 64 GitHub skill repos in two tiers. The installer clones each one fresh and installs every skill in it, so you always get the latest version |
| `catalog/mcp.json` | 12 MCP servers: Awwwards (award-site inspiration), 21st.dev Magic, Magic UI, shadcn, Playwright, Chrome DevTools, Context7, Three.js devtools, LottieFiles, Figma, plus Firecrawl and Vercel in the extended tier |
| `install.mjs` | the installer (`install.ps1` / `install.sh` just launch it) |

**Highlights of the core catalog:** Anthropic's frontend-design, the official GSAP skills, Impeccable, Taste, UI/UX Pro Max,
Emil Kowalski's motion skills, unslop, Motionsites, Hallmark, Vercel's web-design guidelines, a full Three.js / GSAP / R3F /
Motion / Lenis set, LottieFiles motion design, Addy Osmani's web-quality checks, scroll-craft, genjutsu and several
Awwwards-specific skills.

**How the installer handles the mess:** many repos ship the same skill for several AI tools (`.cursor/`, `.codex/`, ...); it
takes the Claude copy. A skill that's already installed is skipped; a *different* skill with the same name is installed as
`name-owner` so nothing is lost. Big repos are filtered (e.g. only the UI and web-design sets from MengTo/Skills).

Not in this repo because they follow your Claude account: Claude's built-in skills, your claude.ai plugins (superpowers,
design, CodeRabbit…) and connectors (Higgsfield, Netlify, 21st.dev, Gmail, Drive…).

## Updating

Add a repo to `catalog/skills.json` (or a server to `catalog/mcp.json`), or drop a skill folder into `skills/`, then commit
and push. On other computers: `git pull`, then re-run the installer (add `--force` to refresh existing skills).

See [SOURCES.md](SOURCES.md) for licences.
