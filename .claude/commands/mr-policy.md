$ARGUMENTS

**MANDATORY: Create a TodoWrite checklist and execute with intelligent subagent routing:**

**Step 1: Analyze prompt content and determine required subagents**
- Check if prompt mentions CLAUDE.md changes, policy modifications, or development guideline updates → Use claude-md-policy-analyst
- Check if prompt mentions ./.claude/agents/, ./.claude/commands/, Makefile, or workflow automation → Use workflow-automation-analyst
- Check if prompt requires both types of analysis → Use both subagents

**Step 2: Execute appropriate subagent(s) based on analysis**
- If CLAUDE.md-related: Run claude-md-policy-analyst subagent first
- If workflow automation-related: Run workflow-automation-analyst subagent  
- If both: Run claude-md-policy-analyst first, then workflow-automation-analyst

**Step 3: Implement recommended changes from subagent analysis**
- Follow subagent recommendations and implementation steps
- Make file modifications as suggested by subagent analysis
- Ensure changes align with existing project structure and policies

**Step 4: [Conditional] Generate commit message if files were modified**
- Only if files were actually created or modified during implementation
- Use commit-message-specialist subagent to generate proper commit message

**Step 5: [Conditional] Execute git workflow if files were modified**
- Only if files were actually created or modified during implementation
- Use git-workflow-manager subagent to stage, commit, and push changes
- Pass generated commit message from Step 4 to git-workflow-manager

**CRITICAL TodoWrite Requirements:**
- **IMMEDIATELY create TodoWrite checklist at the start** - do not begin any work without first using TodoWrite tool
- **Mark each step as "in_progress" BEFORE starting work** - update status in real-time as you work  
- **Mark each step as "completed" IMMEDIATELY after finishing** - never batch completions
- **Update TodoWrite throughout the entire process** - the user wants to see continuous progress tracking
- **Use TodoWrite tool multiple times during complex tasks** - break down large steps into smaller sub-tasks if needed
- Skip conditional steps if conditions aren't met (mark as completed with explanatory note)
- **The TodoWrite checklist is your visible progress tracker for the user**

**Intelligent Routing Logic:**
- **CLAUDE.md keywords**: "CLAUDE.md", "policy", "development guidelines", "project rules", "workflow standards", "quality enforcement"
- **Workflow automation keywords**: ".claude/agents", ".claude/commands", "subagent", "automation", "Makefile", "workflow", "repetitive task", "process improvement"
- **Both required**: When prompt contains keywords from both categories
- **Neither required**: Direct implementation without specialized subagent analysis (rare cases)

**Instructions:**
- **User expects to see TodoWrite updates as primary communication of progress**
- Subagent routing is automatic based on prompt content analysis - no manual decision needed
- Always explain which subagent(s) were selected and why during Step 1