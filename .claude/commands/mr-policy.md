$ARGUMENTS

Create a TodoWrite checklist with these steps, then execute each step in order:

1. Complete the requested policy analysis or workflow task
2. [Conditional] Run claude-md-policy-analyst if CLAUDE.md changes or policy evaluations are involved
3. [Conditional] Run workflow-automation-analyst if workflow automation recommendations are needed
4. [Conditional] Run commit-message-specialist if files were created/modified (to generate proper commit message)
5. [Conditional] Commit and push changes if files were modified

Instructions:
- Mark each step as "in_progress" when starting, "completed" when finished
- Skip conditional steps if their conditions aren't met (mark as completed with note)
- Provide visible progress tracking throughout the workflow
- Do NOT run subagents before implementing the requested changes