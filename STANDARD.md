# STANDARD (EN + RU)

This file is the baseline constitution for all projects. It defines how AI agents must interpret commands, change files, use Git, version releases, branch work, and report results.

Этот файл - базовая конституция для всех проектов. Он задает, как ИИ должен понимать команды, менять файлы, работать с Git, вести версии, работать с ветками и отчитываться.

---

## 1. Rule Hierarchy / Иерархия правил

Before any action, the agent MUST read and apply rules in this order:

1. `STANDARD.md` - global baseline rules for all projects.
2. Project `AGENTS.md` - project-specific rules, structure, commands, build/test details.
3. `AGENTS.local.md` - local machine/workspace additions: paths, ports, env, temporary constraints.

Project and local files MAY add details or aliases. They MUST NOT silently weaken safety rules from `STANDARD.md`.

`STANDARD.md` is read-only by default: the agent MAY read and analyze it, but MUST NOT edit it unless the user explicitly asks to change `STANDARD.md`.

If rules appear to conflict, the agent MUST stop and explain the conflict before doing risky or irreversible work.

---

## 2. Core Principles / Базовые принципы

- ONE STEP -> ONE RESULT. Changes MUST be incremental, reviewable, and testable.
- The agent MUST modify only files needed for the current task.
- The agent MUST preserve existing structure unless the user explicitly requests a structural change.
- The agent MUST avoid rewriting whole files unless the task is to reorganize that file or a smaller edit is unsafe.
- Files SHOULD use UTF-8 and LF when possible.
- The baseline standard MUST NOT contain project-specific absolute paths, ports, branch names, or machine-only settings.
- New dependencies MUST NOT be added unless they are necessary and explained before installation or edit.

---

## 3. Command Protocol / Протокол команд

Before interpreting a short word by everyday meaning, the agent MUST first check whether it is a command from `STANDARD.md`, `AGENTS.md`, or `AGENTS.local.md`.

If a word matches a command from the rules, the agent MUST use the rule meaning and MUST NOT invent another meaning without explicit clarification.

Command matching is case-insensitive. For example, `БКП` and `бкп`, `СОС` and `сос`, `ОКП` and `окп`, `ГИТАНАЛИЗ` and `гитанализ` mean the same command.

| Command | Meaning | Edits allowed? | Side-effect commands allowed? |
| --- | --- | --- | --- |
| `ОКП` (`Объясни Как Понял`) | Explain understanding of the task. Wait for confirmation. | No | No |
| `ОК` (`Можно Выполнять`) | Proceed with the already discussed task. | Yes | Yes, if needed and safe |
| `СП` (`Скриншот Прикреплен`) | Analyze the attached screenshot, identify what is shown, explain the visible issue or incomplete part, and connect it to the task context. | No | Read-only image analysis only |
| `ДВЗ` (`Добавь В Задачи`) | Add the provided task text to `PROJECT_TASKS.md` with priority and number; do not execute now. | Only backlog file | No unrelated actions |
| `СОС` (`Сделано Осталось Следующее`) | Report Status: Done / Remaining / Next. Keep it concise and copy-ready. | No | No |
| `АНАЛИЗ` (`Только Анализ`) | Analysis only. No edits. | No | Read-only commands only |
| `АНАЛИЗ+ТЕСТ` (`Анализ И Проверка`) | Analysis plus build/tests. No edits. Report results. | No | Build/test commands allowed |
| `ОИИ` (`Обнови Историю Изменений`) | Manually update changelog/history for the current step; append only, never rewrite history. Automatic `CHANGELOG.md` updates still remain required by workflow. | Changelog/history only, unless project rules require version sync | Safe validation commands only |
| `БКП` (`Сделай Резервную Копию Проекта`) | Create a backup before major changes. | Backup output only | Backup commands allowed |
| `гит` (`Синхронизируй Изменения С Гитхабом`) | Sync flow: pull -> build/lint/test per project -> Conventional Commit -> push. | Only if required by the flow | Git/build/test commands allowed |
| `гитанализ` (`Анализировать Гитхаб И Сверить С Текущим Проектом`) | Analyze local/remote `develop` state for continuing work across machines; do not pull automatically. | No | Read-only Git commands allowed |
| `гитпуш` (`Аккуратно Загрузить Всё В Гитхаб`) | Final GitHub publishing flow: prepare clean commits, required changelog/version updates, tags when needed, and push everything required. | Yes | Git/build/test/tag commands allowed |
| `гитрел` (`Подготовь И Отправь Релиз`) | Release flow: pull -> release build/test -> version bump -> changelog -> tag -> push + tags. | Yes | Git/build/test/tag commands allowed |

Project files MAY define aliases, for example `добавь в таск` or `добавь в задачи` as aliases for `ДВЗ`. Aliases must be explicit in project rules.

If the user sends `ДВЗ` alone, the agent MUST ask what task text to add. If the user sends text with `ДВЗ`, the agent MUST treat the surrounding or provided text as the task to add to `PROJECT_TASKS.md` and MUST NOT execute that task now.

If the user gives an unknown short command, the agent MUST ask for clarification instead of guessing.

---

## 4. Confirmation Rules / Правила подтверждения

- After `ОКП`, the agent MUST only explain understanding and wait for `ОК`.
- Without `ОК`, the agent MAY discuss, analyze, or clarify, but MUST NOT edit files if project rules require explicit confirmation.
- For multi-point tasks, the agent MUST restate the full checklist before implementation when project rules require it.
- If the user changes one point of a checklist, the agent MUST rebuild the full checklist before editing.
- If a task has hidden risk, the agent MUST pause, explain the tradeoff, and ask for confirmation.

---

## 5. Work Cycle / Рабочий цикл

For implementation tasks, the agent SHOULD follow this cycle:

1. Read the relevant rules and project context.
2. Check current Git status.
3. Pull before work when project and network conditions allow it.
4. Explain briefly what will change before editing.
5. Make the smallest safe edit.
6. Run relevant validation if available.
7. Report changed files, validation results, and any remaining work.

If `git pull` or validation cannot run because of network, missing tools, permissions, sandbox, missing files, or environment limits, the agent MUST report exactly what was not completed and why.

---

## 6. Standard Adoption / Применение стандарта

When the user asks to analyze or apply STANDARD.md, including commands such as анализ стандарт or анализируй STANDARD.md, the agent MUST treat it as a project-standard adoption flow, not only as a summary request.

The agent MUST:

1. Read `STANDARD.md`.
2. Read project rule files such as `AGENTS.md` and `AGENTS.local.md` when they exist.
3. Inspect standard-related project files such as `PROJECT_TASKS.md`, `CHANGELOG.md`, version files, and Git branch setup when relevant.
4. Explain what is already compliant and what does not match the standard.
5. Explain what files need updates before editing.
6. Update only rule, task, changelog, or project metadata files needed for compliance, unless the user explicitly asks to change application code.
7. Preserve project-specific rules that do not conflict with `STANDARD.md`.
8. Report changed files and remaining gaps.

If project rules require confirmation before edits, the agent MUST present the adoption plan and wait for `ОК` before modifying files.

---

## 7. Backlog / Бэклог

- `ДВЗ` means `Добавь В Задачи`.
- `ДВЗ` MUST add the requested future task to `PROJECT_TASKS.md` or the project-defined backlog file.
- `ДВЗ` MUST NOT execute the task immediately.
- The agent MUST preserve existing tasks and numbering.
- New tasks MUST receive the next available number inside the selected priority group, or the next global number if the project uses one shared sequence.
- If priority is provided by the user, the agent MUST use it.
- If priority is not provided, the agent MUST choose the priority by impact and explain the choice briefly.
- `PROJECT_TASKS.md` SHOULD group tasks by priority: `Критично`, `Важно`, `Позже`.
- `СОС` MAY reference backlog numbers when useful.

Priority definitions:

- `Критично` - gives the biggest immediate gain: stability, predictability, working UX, regression protection.
- `Важно` - strong next-layer improvements after the base is stable.
- `Позже` - useful directions that must not break the current focus; optional, low-value, or non-essential improvements also belong here.

---

## 8. Versioning & Changelog / Версионирование

- Projects SHOULD use SemVer: `MAJOR.MINOR.PATCH`.
- `PATCH` is for fixes and small behavior or UX improvements.
- `MINOR` is for backward-compatible features or significant UX expansion.
- `MAJOR` is for breaking changes, incompatible behavior, or major architecture shifts.
- If a project has build numbers, any code change MUST increment and synchronize them according to project rules.
- `CHANGELOG.md` is the default history file when the project uses `CHANGELOG.md`.
- `CHANGELOG.md` MUST be updated automatically as part of the normal project workflow whenever project version, build, or release rules require a history update.
- Automatic `CHANGELOG.md` updates are mandatory and MUST NOT depend on the user sending `ОИИ`. If a step requires a changelog update, the project MUST update `CHANGELOG.md` automatically.
- `ОИИ` is a separate manual command to update history for the current step; it does not disable, replace, or postpone automatic `CHANGELOG.md` updates required by workflow.
- Changelog or history entries MUST describe only real changes made in the current step.
- Changelog or history MUST be append-only by default: add new numbered entries instead of rewriting old ones.
- Existing changelog entries MUST NOT be replaced or rewritten, except for explicit user-requested corrections.
- Each new changelog entry SHOULD include: version or build, date, time, and a concise description of the change set. Validation result MAY be included when relevant.
- Each manual or automatic history entry SHOULD include version or build context when the project uses versions.
- The agent MUST NOT invent validation results, version numbers, dates, commits, or tags.

Common web example:

- Keep version consistent in `index.html` (`Build x.y.z`), asset query versions, app metadata such as `app.js` (`release.version`), and `CHANGELOG.md`.

Common PlatformIO or firmware example:

- Keep `Unreleased` append-only unless project rules say otherwise.
- Validation line format:
  `Проверка: pio run -e <env> -> SUCCESS (build N) (RAM X%, Flash Y%).`
- Firmware upload line format:
  `Прошивка: pio run -e <env> -t upload [...] -> SUCCESS (build N) (RAM X%, Flash Y%).`

Examples are not mandatory for every project. Project rules define which version files and validation commands apply.

---

## 9. Branch Model / Модель веток

Default shared branch model for multi-machine work: `main` + `develop`.

- `main` contains only stable, production-ready states.
- `develop` is the primary branch for ongoing work, testing, and incremental changes.
- Regular work on home or work machines SHOULD happen in `develop` unless local project rules define another branch.
- Merge `develop` into `main` only after verification that the version is ready to become stable.
- After release to `main`, continue new work from `develop`.
- Feature, fix, or agent branches MAY be used when project rules require isolation, but they SHOULD merge back into `develop` before release.
- The agent MUST NOT switch branches, create branches, merge, or delete branches without a clear user request or project workflow requirement.

---

## 10. Git Rules / Правила Git

- The agent MUST check status before committing or pushing.
- The agent SHOULD pull before work.
- The agent MUST NOT overwrite repository history.
- The agent MUST NOT run destructive Git commands unless explicitly requested and safe in the current context.
- Forbidden by default: `git reset --hard`, `git clean -fd`, `git rebase -i`, `git push --force`.
- Commits SHOULD use Conventional Commits: `type(scope): subject`.
- Commit title is required. Body is optional and should be concise.
- The agent MUST list modified files after changes.
- The agent MUST NOT modify Git configuration unless explicitly requested.

### `гит` flow

When the user says `гит`, the agent MUST:

1. Run `git status`.
2. Run `git pull` when safe.
3. Run project-defined build, lint, or test checks if available.
4. Stop if checks fail, unless the user explicitly asks to commit failing state.
5. Commit with a Conventional Commit title.
6. Push.
7. Report commit title, pushed branch, and validation result.

### `гитанализ` flow

When the user says `гитанализ`, the agent MUST analyze the project state for continuing work from `develop` across multiple machines.

The agent MUST:

1. Run `git status`.
2. Identify the current branch.
3. Fetch remote metadata when network is available, without merging or pulling changes.
4. Inspect local `develop` and remote `origin/develop` when they exist.
5. Summarize recent commits on `develop`.
6. Report whether local `develop` is ahead, behind, diverged, or up to date with `origin/develop`.
7. Report any local uncommitted changes separately.
8. Explain what appears to have been done and where the work seems to have stopped.
9. End by offering to download or update the local computer from `origin/develop` so the user can continue the project after explicit `ОК`.

The agent MUST NOT run `git pull`, merge, rebase, commit, push, switch branches, or edit files during `гитанализ` unless the user gives a separate explicit `ОК` for that next action.

`гитанализ` report template:

- `Branch` - current branch and whether local `develop` exists.
- `Remote` - whether `origin/develop` exists and whether fetch succeeded.
- `Sync state` - ahead, behind, diverged, up to date, or unknown.
- `Local changes` - clean tree or list of uncommitted files.
- `What changed` - short summary of recent `develop` commits.
- `Where stopped` - inferred current stage of work.
- `Next` - offer to download or update from `origin/develop` after explicit `ОК` so work can continue.

### `СП` flow

When the user says `СП`, the agent MUST inspect the attached screenshot or image as task input.

The agent MUST:

1. Identify what is visible in the screenshot.
2. Explain the visible issue, gap, warning, incorrect state, or area that needs work.
3. Connect the screenshot to the user request or current project context.
4. State clearly what part of the interface, workflow, or file likely needs attention.
5. Avoid guessing hidden details that are not visible.

If no screenshot is actually attached, the agent MUST say that the screenshot is missing and ask the user to attach it.

### `гитпуш` flow

When the user says `гитпуш`, the agent MUST prepare and publish the current work to GitHub in a clean and understandable way.

The agent MUST:

1. Run `git status`.
2. Verify which files should be included and avoid unrelated local changes.
3. Ensure required version, changelog, and history updates are complete according to project rules.
4. Create clean Conventional Commit commit(s).
5. Create tag(s) when project rules or release state require them.
6. Push commits.
7. Push tags when tags were created.
8. Report what was published: branch, commit title(s), tag(s), and any files intentionally left out.

The agent MUST stop and explain what is missing if versioning, changelog, validation, or Git state is not ready for a clean publish.
### `гитрел` flow

When the user says `гитрел`, the agent MUST:

1. Run `git status`.
2. Run `git pull` when safe.
3. Identify release level: `patch`, `minor`, or `major`. If unclear, ask.
4. Run project-defined release build or test checks.
5. Bump version or build in all project-defined files.
6. Update changelog or history for the release.
7. Create a release tag only after successful validation and version sync.
8. Push commits and tags.
9. Report version, tag, branch, and validation result.

The agent MUST stop before tagging or pushing if validation fails or version files are inconsistent.

---

## 11. Safety Rules / Правила безопасности

- The agent MUST protect user work and unrelated changes.
- The agent MUST NOT revert files it did not change unless explicitly requested.
- The agent MUST NOT delete or rename files without explaining why and receiving permission when risk is non-trivial.
- The agent MUST NOT perform broad refactors while solving a narrow task.
- The agent MUST stop and ask if it discovers unexpected changes that conflict with the current task.
- The agent MUST prefer safe, reversible edits.

---

## 12. Style & Performance / Стиль и производительность

- Keep functions small and readable.
- Minimize global state.
- Use semantic HTML where relevant.
- Keep CSS layout logic simple.
- Avoid heavy DOM updates.
- Prefer event delegation, simple state management, and minimal reflows when relevant.
- Add comments only for non-obvious logic.

---

## 13. Reporting / Отчет

After implementation, the agent MUST report:

- What changed.
- Which files changed.
- What validation was run and the result.
- What was not done, if anything remains.

Reports should be concise, concrete, and easy to copy into project notes.

If the agent cannot complete any required part of the standard because of environment limits, it MUST explicitly list: `not completed`, `reason`, and `safe next step`.

---

## 14. Glossary / Словарь

- `Standard` - the baseline rules in `STANDARD.md` that apply to all projects.
- `Project rules` - project-specific rules in `AGENTS.md`.
- `Local rules` - machine or workspace-specific rules in `AGENTS.local.md`.
- `Adoption` - the process of checking a project against `STANDARD.md` and updating rule, task, history, or metadata files so the project follows the standard.
- `Backlog` - the future task list, usually `PROJECT_TASKS.md`.
- `History` / `Changelog` - append-only record of real changes, versions, validation, and release notes.
- `Validation` - checks that prove the current state works, such as build, lint, test, or manual verification defined by the project.
- `Release` - a stable versioned state prepared for users or `main`.
- `develop` - default ongoing work branch in the shared branch model.
- `main` - stable branch in the shared branch model.

---

## 15. Per-Project Addenda / Локальные дополнения

Project-specific details belong in `AGENTS.md`.

Local machine or workspace details belong in `AGENTS.local.md`.

Examples of local details:

- backup directory;
- local server port;
- build environment name;
- machine-specific paths;
- temporary workflow restrictions;
- project-specific command aliases.

Base rules are not copied into local files. Local files only add the details needed for that project or machine.
