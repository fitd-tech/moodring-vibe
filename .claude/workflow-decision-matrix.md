# Workflow Decision Matrix

## When to Use Each Approach

### Development Task Commands (Choose Most Specific):

#### Use `/mr-bug` for:
- **Bug investigation** and systematic debugging
- **Error resolution** and crash investigation  
- **Issue troubleshooting** with root cause analysis
- **Runtime problems** requiring diagnostic methodology

**Examples:**
- "Fix the playlist generation crash"
- "Debug the authentication timeout error" 
- "Investigate why the API returns 500 errors"
- "Resolve the React Native navigation bug"

#### Use `/mr-feature` for:
- **New feature implementation** from scratch
- **Major functionality additions** to existing systems
- **Feature enhancements** requiring substantial code changes
- **Integration of new capabilities**

**Examples:**
- "Implement user authentication system"
- "Add playlist sharing functionality" 
- "Create the tag hierarchy management UI"
- "Build the Spotify playlist export feature"

#### Use `/mr-clean` for:
- **Technical debt cleanup** and temporary code removal
- **TODO: TEMP item** systematic cleanup
- **Code organization** improvements and refactoring debt
- **Legacy code** modernization initiatives

**Examples:**
- "Clean up all TODO: TEMP items in the auth module"
- "Remove deprecated API endpoints"
- "Refactor the legacy playlist generation code"
- "Organize scattered utility functions"

#### Use `/mr-tests` for:
- **Test coverage** improvements and gap analysis  
- **Test-driven development** workflows
- **Coverage verification** for new or modified code
- **Testing strategy** implementation

**Examples:**
- "Add tests for the new authentication service"
- "Improve test coverage for the playlist module"
- "Write integration tests for the API endpoints"
- "Verify 80% coverage requirement is met"

#### Use `/mr-code` for:
- **Mixed development tasks** requiring multiple workflow types
- **Complex multi-step implementations** 
- **General code changes** that don't fit specialized categories
- **Comprehensive quality workflow** when unsure which specialized command to use

**Examples:**
- "Refactor authentication and add error handling" (mixed bug fix + feature)
- "Update the user model with better validation and tests" (mixed implementation)
- "Implement playlist caching with cleanup of old cache logic" (mixed feature + cleanup)

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
├─ YES → What type of development task?
│  ├─ Policy/workflow changes → Use /mr-policy
│  ├─ Bug investigation/fixing → Use /mr-bug
│  ├─ New feature implementation → Use /mr-feature  
│  ├─ Technical debt cleanup → Use /mr-clean
│  ├─ Test coverage/testing → Use /mr-tests
│  └─ Mixed/complex/unclear → Use /mr-code
└─ NO → Use direct implementation
```

## Key Principles

1. **File modifications** → Use most specific slash command for the task type
2. **Policy/workflow changes** → Use `/mr-policy`  
3. **Bug investigation** → Use `/mr-bug`
4. **Feature development** → Use `/mr-feature`
5. **Technical debt cleanup** → Use `/mr-clean` 
6. **Testing/coverage** → Use `/mr-tests`
7. **Mixed/complex tasks** → Use `/mr-code` for comprehensive workflow
8. **Information only** → Direct implementation
9. **When in doubt** → Use `/mr-code` or ask which approach to use

**Priority**: Choose the most specific command that matches your primary objective. If the task spans multiple categories, use `/mr-code` for comprehensive coverage.

## Quality Enforcement

- **Slash commands** automatically enforce quality standards via TodoWrite checklists
- **Direct implementation** relies on CLAUDE.md fallback enforcement
- **All file changes** must follow quality standards regardless of approach used

## IMPORTANT: Agent Behavior - Context-Aware Slash Command Handling

**The general-purpose agent should NEVER attempt to execute custom slash commands directly.** However, the agent's response must be context-aware:

### When User is NOT Using a Slash Command:
If the user requests a task that requires a slash command but didn't use one:
1. **Stop execution** of the requested task
2. **Inform the user** which slash command should be used
3. **Explain why** that approach is recommended  
4. **Wait for the user** to execute the appropriate slash command

### When User IS Using the Correct Slash Command:
If the user's request begins with the appropriate slash command (e.g., "/mr-code fix this bug"):
1. **Proceed with the task** as requested
2. **Do NOT interrupt** or suggest using the same command they already used
3. **Cannot execute slash commands directly**, but should acknowledge the request appropriately

### When User IS Using the Wrong Slash Command:
If the user uses an inappropriate slash command for their task:
1. **Stop execution** of the requested task
2. **Inform the user** of the correct slash command to use instead
3. **Explain why** the different approach is more appropriate
4. **Wait for the user** to execute the correct slash command

### Example Behaviors:
- ❌ **"Fix this bug"** → Interrupt: "Please use /mr-bug for systematic debugging"
- ✅ **"/mr-bug fix this bug"** → Proceed: "I'll help with systematic debugging of this issue"  
- ❌ **"/mr-policy fix this bug"** → Redirect: "For bug fixing, please use /mr-bug instead of /mr-policy"

This ensures proper workflow orchestration while preventing harmful interruption of users who already use the correct slash commands.