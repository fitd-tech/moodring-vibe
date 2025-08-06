$ARGUMENTS

Create a TodoWrite checklist with these steps, then execute each step in order:

1. Complete the requested development task
2. [Conditional] Run test-coverage-enforcer if files were created/modified (to verify coverage standards)
3. [Conditional] Run codebase-organization-specialist if significant changes were made (to analyze and improve code architecture)
4. [Conditional] Run pre-commit-quality-guard if files were created/modified (to enforce quality before commit)
5. [Conditional] Run commit-message-specialist if files were created/modified (to generate proper commit message)
6. [Conditional] Commit and push changes if files were modified

Instructions:
- Mark each step as "in_progress" when starting, "completed" when finished
- Skip conditional steps if their conditions aren't met (mark as completed with note)
- Provide visible progress tracking throughout the workflow
- Do NOT run subagents before implementing the requested changes