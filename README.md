# My Claude skills

Every custom skill and agent I use with Claude Code, in one place, so a new computer gets all of them in one go.

## Install on a new computer

You need Git, and to be signed in to GitHub on that computer (this repo is private).

**Windows (PowerShell):**

```powershell
git clone https://github.com/<you>/claude-skills.git $HOME\claude-skills
powershell -ExecutionPolicy Bypass -File $HOME\claude-skills\install.ps1
```

**macOS / Linux:**

```bash
git clone https://github.com/<you>/claude-skills.git ~/claude-skills
bash ~/claude-skills/install.sh
```

Then start a new Claude Code session. Skills that already exist are skipped; add `-Force` (PowerShell) or `--force` (bash) to overwrite them with this repo's copy.

**Or just hand it to Claude:** paste this repo's URL and say *"install my skills from this repo"*. Claude clones it and runs the installer for your system.

## What gets installed

| Where | What |
|---|---|
| `skills/` | 32 skills copied into `~/.claude/skills` |
| `agents/` | 5 agents (the Impeccable reviewers) copied into `~/.claude/agents` |
| `upstream.json` | 2 skills pulled fresh from their original GitHub repos at install time: **unslop** and **motionsites-web-builder** (their licences don't allow re-hosting everything, see below) |

Not in this repo, because they come with the account rather than the computer:

- **Claude's built-in skills** (documents, spreadsheets, slides, PDF, docs, browser, artifacts…) ship with the Claude app.
- **Plugins** (superpowers, design, frontend-design, humanizer, CodeRabbit, Apollo…) come from your claude.ai plugin catalog and load when you sign in. Connectors (Higgsfield, 21st.dev, Netlify, Gmail, Drive…) are also tied to the account.

## Updating

After adding or changing skills on any computer, copy them into `skills/` here, commit and push. Re-run the installer elsewhere with `-Force` / `--force` to pick up the changes.

See [SOURCES.md](SOURCES.md) for where each skill came from and its licence.
