---
trigger: always_on
description: Enforce Git Flow (Main-based) for feature and bugfix branches
---

# Git Flow Rule

When working on new features or bug fixes, ALWAYS follow this workflow:

1.  **Start from Main**:
    -   Ensure you are on the `main` branch: `git checkout main`
    -   Pull the latest changes: `git pull origin main`

2.  **Create a Branch**:
    -   **Features**: Use the `feature/` prefix.
        -   Example: `git checkout -b feature/add-login-screen`
    -   **Bug Fixes**: Use the `bugfix/` (or `fix/`) prefix.
        -   Example: `git checkout -b bugfix/fix-login-error`

3.  **Commit Changes**:
    -   Make frequent, atomic commits with descriptive messages, include an emoji relevant to the type of change being done as the first character in the commit, as would be done with the Conventional Commit extension in VSCode.
    -   Example: `git commit -m "Add login form validation"`

4.  **Completion**:
    -   Push the branch to origin: `git push -u origin <branch-name>`
    -   Do NOT merge into `main` locally.
    -   Notify the user that the branch is pushed and ready for a Pull Request.

**NEVER** commit directly to `main` for non-trivial changes.