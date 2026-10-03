---
name: find-skills
description: Helps users discover and install agent skills from The Agent Skills Directory (skills.sh) when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending agent capabilities.
---

# Find Skills

This skill helps you discover and install skills from the open agent skills ecosystem ([The Agent Skills Directory - skills.sh](https://skills.sh/)).

## When to Use This Skill

Use this skill when the user:
- Asks "how do I do X" where X might be a common task with an existing skill.
- Says "find a skill for X" or "is there a skill for X".
- Asks "can you do X" where X is a specialized capability.
- Expresses interest in extending agent capabilities.
- Wants to search for tools, templates, or workflows.
- Mentions they wish they had help with a specific domain (design, testing, deployment, audio, offline storage, etc.).

## What is the Skills CLI?

The Skills CLI (`npx skills`) is the package manager for the open agent skills ecosystem. Skills are modular packages that extend agent capabilities with specialized knowledge, workflows, and tools.

### Key Commands
- `npx skills find [query] [--owner <owner>]` — Search for skills interactively or by keyword, optionally scoped to a GitHub owner.
- `npx skills add <package>` — Install a skill from GitHub or other sources (e.g., `npx skills add vercel-labs/skills@find-skills`).
- `npx skills update` — Update all installed skills to their latest versions.

**Browse skills catalog at:** [https://skills.sh/](https://skills.sh/)

## How to Help Users Find and Install Skills

### Step 1: Understand What They Need
1. **Domain:** (e.g., Audio processing, ONNX runtime, testing, DHIS2, offline PWA, responsive design).
2. **Specific Task:** (e.g., writing tests, creating animations, running on-device inference).
3. **Check whether a skill exists:** Check the leaderboard at [skills.sh](https://skills.sh/) or search via CLI.

### Step 2: Search for Relevant Skills
Search via terminal or query:
```bash
npx skills find <keyword>
```

### Step 3: Install and Configure
When a suitable skill is selected, install it to the local workspace:
```bash
npx skills add <owner/repo@skill-name>
```
Once installed, verify that the skill's `SKILL.md` is placed under `.agents/skills/<skill-name>/SKILL.md` so the agent can discover and activate it.
