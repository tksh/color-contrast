# AGENTS.md

## Development Guidelines

### Tooling

- Use Deno-native tooling whenever possible.
- Prefer built-in Deno functionality over introducing additional development dependencies.
- Do not introduce third-party formatters or linters such as Prettier or ESLint unless explicitly requested.
- Use `deno fmt` for formatting TypeScript, JavaScript, Markdown, JSON, and other supported files.
- Use `deno lint` for linting.
- Use `deno test` for testing.
- Use `deno check` for TypeScript type checking.

### Formatting and Code Quality

- Follow the existing project conventions and configuration.
- Run `deno fmt` to format modified files and documents before completing a task.
- Do not manually reformat files in ways that conflict with the configured Deno formatter.
- Preserve intentional formatting choices supported by the project configuration, including Markdown wrapping preferences.
- Keep implementations simple and avoid unnecessary abstractions or dependencies.

## Git Hooks

### Hook Configuration

This repository uses a Git `pre-commit` hook located at:

`.githooks/pre-commit`

The hook runs `deno fmt --check` to verify formatting before each commit.

At the beginning of each working session:

- Check whether the local Git configuration uses `.githooks` as its hooks directory.
- If `core.hooksPath` is unset or configured differently, enable the repository hooks by running:

  `git config --local core.hooksPath .githooks`

- Verify that `.githooks/pre-commit` exists and is executable.
- Do not modify or disable the hook configuration without explicit authorization.

### Hook Usage

- Do not bypass Git hooks using `--no-verify` or other equivalent mechanisms.
- Do not disable hooks temporarily to make a commit succeed.
- If a hook fails, investigate and fix the underlying issue before attempting the commit again.
- If Deno is unavailable or the hook cannot run correctly, report the problem rather than bypassing the check.

## Before Completing Changes

Before considering a task complete:

- Run `deno fmt` to format modified files and documents.
- Run `deno fmt --check` to verify formatting.
- Run `deno lint` to check for linting issues.
- Run relevant tests using `deno test`.
- Run `deno check` on relevant public entry points and modules.
- Resolve any errors introduced by the changes.
- Do not claim that a check passed unless it was actually executed successfully.

Only run checks relevant to the affected parts of the project when the full test suite or a particular check is not applicable. Clearly report any checks that could not be completed.

## Commit Messages

- Use Conventional Commits format for commit messages, such as `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, and `chore:`.
- Use a concise, descriptive summary that reflects the actual changes.
- Do not include any credit attribution for the AI agent itself in commit messages.
- Do not add `Co-Authored-By` trailers, "generated with" lines, or other AI attribution.
- Keep commit messages focused on the actual changes, without additional attribution or promotional text.
