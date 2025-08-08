$ARGUMENTS

**This command handles comprehensive development tasks including:**
- Feature implementation and bug fixes
- Code refactoring and optimization  
- Component/service creation
- API endpoint development
- Database schema changes
- Test implementation
- Documentation updates (for code)

**MANDATORY: Create a TodoWrite checklist with these exact steps, then execute each step in order:**

1. **Analyze the development task** - Break down requirements and approach
2. **Complete the requested development task** - Implement all required changes
3. **[Conditional] Run test-coverage-enforcer** if files were created/modified (to verify 80% coverage standards)
4. **[Conditional] Run codebase-organization-specialist** if significant changes were made (>5 files, architectural changes, or new major features)
5. **[Conditional] Run pre-commit-quality-guard** if files were created/modified (to enforce zero-tolerance quality standards)  
6. **[Conditional] Run commit-message-specialist** if files were created/modified (to generate comprehensive commit message)
7. **[Conditional] Run git-workflow-manager** if files were modified (to stage, commit, and push changes)
8. **[Conditional] Clean up development servers** (kill test servers on ports 3000-3099, 8000-8099)

**CRITICAL TodoWrite Requirements:**
- **IMMEDIATELY create TodoWrite checklist at the start** - do not begin any work without first using TodoWrite tool
- **Mark each step as "in_progress" BEFORE starting work** - update status in real-time as you work
- **Mark each step as "completed" IMMEDIATELY after finishing** - never batch completions
- **Update TodoWrite throughout the entire process** - the user wants to see continuous progress tracking
- **Use TodoWrite tool multiple times during complex tasks** - break down large steps into smaller sub-tasks if needed
- Skip conditional steps if conditions aren't met (mark as completed with explanatory note)
- **The TodoWrite checklist is your visible progress tracker for the user**

**Instructions:**
- Do NOT run subagents before completing step 2 (the actual implementation)
- Follow all CLAUDE.md quality standards and git workflow requirements  
- Ensure all changes are tested, linted, and formatted before commit
- User expects to see TodoWrite updates as primary communication of progress