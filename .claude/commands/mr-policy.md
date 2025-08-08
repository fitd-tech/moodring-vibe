$ARGUMENTS

**MANDATORY: Create a TodoWrite checklist with these exact steps, then execute each step in order:**

1. **Complete the requested policy analysis or workflow task**
2. **[Conditional] Run claude-md-policy-analyst** if CLAUDE.md changes or policy evaluations are involved
3. **[Conditional] Run workflow-automation-analyst** if workflow automation recommendations are needed
4. **[Conditional] Run commit-message-specialist** if files were created/modified (to generate proper commit message)
5. **[Conditional] Run git-workflow-manager** if files were created/modified (to stage, commit, and push changes)

**CRITICAL TodoWrite Requirements:**
- **IMMEDIATELY create TodoWrite checklist at the start** - do not begin any work without first using TodoWrite tool
- **Mark each step as "in_progress" BEFORE starting work** - update status in real-time as you work  
- **Mark each step as "completed" IMMEDIATELY after finishing** - never batch completions
- **Update TodoWrite throughout the entire process** - the user wants to see continuous progress tracking
- **Use TodoWrite tool multiple times during complex tasks** - break down large steps into smaller sub-tasks if needed
- Skip conditional steps if conditions aren't met (mark as completed with explanatory note)
- **The TodoWrite checklist is your visible progress tracker for the user**

**Instructions:**
- Do NOT run subagents before implementing the requested changes
- **User expects to see TodoWrite updates as primary communication of progress**