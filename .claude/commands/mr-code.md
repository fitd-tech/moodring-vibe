$ARGUMENTS

**This command handles comprehensive development tasks including:**
- Feature implementation and bug fixes
- Code refactoring and optimization  
- Component/service creation
- API endpoint development
- Database schema changes
- Test implementation
- Documentation updates (for code)

**Create a TodoWrite checklist with these steps, then execute each step in order:**

1. **Analyze the development task** - Break down requirements and approach
2. **Complete the requested development task** - Implement all required changes
3. **[Conditional] Run test-coverage-enforcer** if files were created/modified (to verify 80% coverage standards)
4. **[Conditional] Run codebase-organization-specialist** if significant changes were made (>5 files, architectural changes, or new major features)
5. **[Conditional] Run pre-commit-quality-guard** if files were created/modified (to enforce zero-tolerance quality standards)  
6. **[Conditional] Run commit-message-specialist** if files were created/modified (to generate comprehensive commit message)
7. **[Conditional] Commit and push changes** if files were modified
8. **[Conditional] Clean up development servers** (kill test servers on ports 3000-3099, 8000-8099)

**Instructions:**
- Mark each step as "in_progress" when starting, "completed" when finished
- Skip conditional steps if their conditions aren't met (mark as completed with explanatory note)
- Provide visible progress tracking throughout the workflow
- Do NOT run subagents before completing step 2 (the actual implementation)
- Follow all CLAUDE.md quality standards and git workflow requirements
- Ensure all changes are tested, linted, and formatted before commit