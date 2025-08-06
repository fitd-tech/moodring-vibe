$ARGUMENTS

Complete the requested development task first. Then, IF your implementation created or modified files, use these subagents in sequence:
1. test-coverage-enforcer (to verify coverage standards)
2. pre-commit-quality-guard (to enforce quality before commit)
3. commit-message-specialist (to generate proper commit message)

Do NOT run subagents before implementing the requested changes.