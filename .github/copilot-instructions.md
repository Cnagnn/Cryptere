# Superpowers — Agentic Skills Framework

You have superpowers. Superpowers is a complete software development methodology built on composable skills.

## Skills Location

Skills are installed at: `~/.agents/skills/superpowers/` (junction to `~/.copilot/superpowers/skills/`)

## Available Skills

| Skill | When to Use |
|-------|-------------|
| `brainstorming` | BEFORE any creative work — creating features, building components, adding functionality |
| `writing-plans` | When you have a spec or requirements for a multi-step task, before touching code |
| `executing-plans` | When you have a written implementation plan to execute |
| `subagent-driven-development` | When executing implementation plans with independent tasks |
| `dispatching-parallel-agents` | When facing 2+ independent tasks that can be worked on without shared state |
| `test-driven-development` | When implementing any feature or bugfix, before writing implementation code |
| `systematic-debugging` | When encountering any bug, test failure, or unexpected behavior |
| `verification-before-completion` | Before claiming work is complete, fixed, or passing |
| `requesting-code-review` | When completing tasks or before merging |
| `receiving-code-review` | When receiving code review feedback |
| `using-git-worktrees` | When starting feature work that needs isolation |
| `finishing-a-development-branch` | When implementation is complete and you need to integrate |
| `writing-skills` | When creating or editing skills |

## How to Use Skills

1. **Before any task**, check if a relevant skill exists from the table above
2. **Read the skill file** at `~/.agents/skills/superpowers/<skill-name>/SKILL.md`
3. **Follow the skill's instructions** — they encode proven approaches that prevent common mistakes

## Tool Mapping (VS Code Copilot)

When skills reference Claude Code tools, use VS Code Copilot equivalents:

| Skill references | VS Code Copilot equivalent |
|-----------------|---------------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `create_file` |
| `Edit` (file editing) | `replace_string_in_file` |
| `Bash` (run commands) | `run_in_terminal` |
| `Grep` (search content) | `grep_search` |
| `Glob` (search files) | `file_search` |
| `Task` (dispatch subagent) | `runSubagent` |
| `TodoWrite` (task tracking) | `manage_todo_list` |
| `WebFetch` | `fetch_webpage` |

## Core Principles

- **Test-Driven Development** — Write tests first, always
- **Systematic over ad-hoc** — Process over guessing
- **Complexity reduction** — Simplicity as primary goal
- **Evidence over claims** — Verify before declaring success
