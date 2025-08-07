# Workflow Decision Matrix

## When to Use Each Approach

### Use `/mr-code` for:
- **Development Tasks** involving code implementation
- **File modifications** (creating, updating, deleting code files)
- **Feature implementation** 
- **Bug fixes** requiring code changes
- **Refactoring** existing code
- **New component/service creation**
- **API endpoint implementation**
- **Database schema changes**

**Examples:**
- "Implement user authentication"
- "Add a new React component"
- "Fix the playlist generation bug"
- "Refactor the authentication service"
- "Add tests for the new feature"

### Use `/mr-policy` for:
- **Policy analysis** and evaluation
- **CLAUDE.md changes** or rule proposals
- **Workflow improvements** and automation analysis
- **Process documentation** updates
- **Development guideline** modifications
- **Quality standard** evaluations

**Examples:**
- "Should we change our testing requirements?"
- "Analyze this proposed CLAUDE.md change"
- "How can we automate our deployment process?"
- "Evaluate this new development workflow"

### Use **Direct Implementation** for:
- **Simple information requests** (no file changes)
- **Code explanations** without modifications
- **Architecture discussions** 
- **Troubleshooting** without code changes
- **Documentation reading** or analysis
- **Quick questions** about existing code

**Examples:**
- "Explain how the authentication flow works"
- "What's the current project structure?"
- "Help me understand this error message"
- "Show me the database schema"

## Decision Flow

```
Is this a development task that will modify files?
├─ YES → Will it involve policy/workflow changes?
│  ├─ YES → Use /mr-policy
│  └─ NO → Use /mr-code
└─ NO → Use direct implementation
```

## Key Principles

1. **File modifications** → Use slash commands
2. **Policy/workflow changes** → Use /mr-policy  
3. **Code implementation** → Use /mr-code
4. **Information only** → Direct implementation
5. **When in doubt** → Ask which approach to use

## Quality Enforcement

- **Slash commands** automatically enforce quality standards via TodoWrite checklists
- **Direct implementation** relies on CLAUDE.md fallback enforcement
- **All file changes** must follow quality standards regardless of approach used

## IMPORTANT: Agent Behavior

**The general-purpose agent should NEVER attempt to execute custom slash commands (`/mr-code`, `/mr-policy`).** Instead, when the decision matrix indicates a slash command should be used, the agent must:

1. **Stop execution** of the requested task
2. **Inform the user** which slash command should be used
3. **Explain why** that approach is recommended
4. **Wait for the user** to execute the appropriate slash command

This ensures proper workflow orchestration and prevents the agent from bypassing the specialized command systems.