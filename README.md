# color-contrast

A lightweight, dependency-free TypeScript utility for choosing readable text
colors using WCAG contrast calculations and configurable contrast targets.

## Development

### Git Hooks Setup

After cloning the repository, run the following commands from the repository
root to enable the pre-commit hook:

```sh
chmod +x .githooks/pre-commit
git config --local core.hooksPath .githooks
```

This configures Git to use the repository's `.githooks/` directory and enables
the pre-commit hook, which checks code formatting using `deno fmt --check`
before each commit.
