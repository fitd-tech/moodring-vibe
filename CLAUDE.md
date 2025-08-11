# Moodring Development Project

## Project Overview
Moodring is a multi-platform app that integrates with Spotify to provide a new way to organize music through robust hierarchical tags.

## Core Features
- Users share songs/playlists from Spotify to Moodring
- Assign hierarchical tags to songs and playlists
- Create custom playlists by combining/excluding tags
- Save generated playlists back to Spotify

## Technical Stack
- **Backend**: Rust + Rocket + PostgreSQL + Diesel ORM
- **Database**: Diesel with async adaptations (diesel-async + tokio::task::spawn_blocking)
- **Frontend**: Expo Go + React Native + TypeScript + TailwindCSS + Metro (bundler)
- **Infrastructure**: Google Cloud Platform + Terraform
- **Style**: 90's retro colorful interface (Trapper Keepers/neon aesthetic) - NO EMOJIS

## Requirements
- Multi-platform deployment (iOS, Android, web, tablet)
- Local development database + GCP production infrastructure
- Spotify API integration (OAuth, playlists, user data)
- Pre-commit linting/styling + comprehensive testing
- Git commit after each completed task
- Light/dark mode support

## Outstanding Technical Details Needed
- Authentication & security specifics (JWT strategy, session management)
- Database schema design (tag hierarchy approach)
- API design (endpoints, rate limiting, caching)
- Development environment setup (Docker, env vars, seeding)

## Development Phase Plan
1. Foundation (Diesel setup + migrations, DB schema, Spotify OAuth, user management)
2. Core Features (tag system, song tagging, playlist generation)
3. Mobile App (Expo setup, UI, deep linking)
4. Deployment (Terraform, CI/CD, app stores)

## Database Implementation Details
- **ORM**: Diesel with diesel_cli for migrations
- **Async Integration**: Use tokio::task::spawn_blocking() for database operations in Rocket handlers
- **Connection Pool**: Rocket's built-in database connection pooling
- **Migrations**: Schema evolution through Diesel migration files

## Testing Requirements
- **All code must have test coverage**: Every function, component, and API endpoint requires corresponding tests
- **Test types**: Unit tests, integration tests, and end-to-end tests where applicable
- **Backend testing**: Use Rust testing framework with `cargo test`
- **Frontend testing**: Use Jest/React Native Testing Library
- **Coverage threshold**: Maintain minimum 80% test coverage
- **Pre-commit testing**: All tests must pass before commits are allowed

## Git Workflow
- **Primary development branch**: `develop` (all local work pushes here)
- **Production branch**: `main` (reserved for CI/CD to production infrastructure)
- **Feature branches**: Create from `develop`, merge back to `develop` via PRs
- **Branch protection**: `main` branch only accepts merges from `develop` via CI/CD

## Core Development Policies

### Quality Enforcement
- **Zero tolerance for warnings**: No commits allowed with outstanding warnings or linting issues
- **Test coverage requirement**: Maintain minimum 80% test coverage for all code
- **Pre-commit validation**: All tests, linting, and formatting checks must pass before commits
- **Security first**: Prioritize security best practices in all development decisions
- **Convention consistency**: Follow existing code conventions and patterns

### Git Workflow Standards
- **Primary development branch**: `develop` (all local work pushes here)
- **Production branch**: `main` (reserved for CI/CD to production infrastructure)
- **Feature branches**: Create from `develop`, merge back to `develop` via PRs
- **Immediate push requirement**: Every commit must be immediately pushed to remote
- **Comprehensive commit messages**: Use structured commit template with detailed descriptions
- **Never commit directly to main**: Always ask permission before pushing to `main` branch

### Development Environment
- **Branch verification**: Always verify current branch with `git branch --show-current` before beginning file edits - ensure you are on the intended branch (`develop` for local work, feature branch for feature development) and not on a detached HEAD state
- **Clean server state**: Kill development servers after task completion (ports 3000-3099, 8000-8099)
- **Database preservation**: Never kill database servers or persistent services
- **Test file protection**: Never modify test files without explicit permission

### Spotify Data Freshness Policy
- **Strategic cache invalidation**: Implement intelligent caching with smart invalidation rather than constant API fetching
- **Navigation-based state reset**: Reset Spotify activity state when navigating between major app sections (Home ↔ Browse Tags) to ensure users see current listening context
- **API rate limit compliance**: Respect Spotify's rate limits (1000 requests/hour per user) through efficient caching strategies
- **Critical vs acceptable staleness**: 
  - **Real-time required**: Currently playing status, active playback controls
  - **Near-real-time acceptable**: Recent tracks (2-5 minutes), user library changes
  - **Periodic refresh acceptable**: Playlists, saved albums (10-15 minutes)
- **User-triggered refresh**: Always provide manual refresh options for user-initiated data updates
- **Offline functionality**: Implement cached data fallbacks for network-poor conditions while prioritizing fresh data when connectivity allows
- **Battery optimization**: Balance data freshness with battery life through intelligent polling intervals and user activity detection

### Task Execution Policy
- **For ALL code changes**: MANDATORY use of TodoWrite Template for Quality Workflow - this includes ALL modifications to code files regardless of size, scope, or complexity (new features, bug fixes, single-line changes, typo corrections, configuration updates, etc.)
- **For development tasks requiring file changes**: Use `/mr-code` slash command for comprehensive quality-enforced workflows
- **For policy/workflow changes**: Use `/mr-policy` slash command for proper analysis and validation
- **For information-only tasks**: Direct implementation is appropriate (no code changes)
- **Emergency fixes**: MANDATORY TodoWrite Template still required - emergency status does not exempt from quality workflow tracking
- **Fallback enforcement**: When slash commands are unavailable, manually execute equivalent quality checks using the fallback checklist below with MANDATORY TodoWrite tracking for ALL code changes
- **Command availability check**: If you cannot use slash commands, inform the user and proceed with fallback enforcement using MANDATORY TodoWrite for ALL code changes
- **TodoWrite subagent coordination**: When subagents are planned in TodoWrite workflows, do NOT perform overlapping tasks manually to avoid redundancy and ensure proper workflow orchestration

### Manual Quality Checklist (Emergency Fallback Only)
*ONLY USE when specialized slash commands are unavailable AND subagents are verified as unavailable:*

**SUBAGENT UNAVAILABILITY VERIFICATION REQUIRED**: Before using manual fallback:
1. Attempt to call each required subagent and document the failure
2. Confirm that subagent infrastructure is down or malfunctioning
3. Get explicit user acknowledgment that manual fallback is authorized
4. Document the unavailability reason in TodoWrite

**CRITICAL**: MANDATORY TodoWrite checklist for ALL code changes - no exceptions for any modifications to code files:

**TodoWrite Template for Quality Workflow - MANDATORY FOR ALL CODE CHANGES:**
1. **Code Implementation** - Use code-implementation-specialist for file changes
2. **Technical Debt Cleanup** - Run tech-debt-cleanup-planner after code changes
3. **Codebase Organization** - Run codebase-organization-specialist after technical debt review
4. **Coverage Verification** - Run test-coverage-enforcer after code changes
5. **Pre-commit Quality Checks** - Run pre-commit-quality-guard subagent
6. **Commit Message Generation** - Use commit-message-specialist subagent
7. **Git Workflow Execution** - Use git-workflow-manager for staging/commit/push
8. **Server Cleanup** - Kill development servers and verify ports

**Subagent Delegation Steps:**
1. **Code Implementation**:
   - Use `code-implementation-specialist` subagent for all code writing, editing, and file creation
   - Handles new features, modifications, database migrations, React Native components, Rust backend code

2. **Pre-commit Quality Checks**:
   - MANDATORY: Use `pre-commit-quality-guard` subagent for ALL changes regardless of size
   - Manual commands (cargo test, npm run lint, etc.) are STRICTLY PROHIBITED during development when subagents are available

3. **Commit Process**:
   - Use `commit-message-specialist` subagent for commit message generation
   - Pass generated message to `git-workflow-manager` subagent for complete git workflow (staging, commit, push)

4. **Technical Debt Cleanup**:
   - Use `tech-debt-cleanup-planner` subagent after all code changes regardless of size
   - Run immediately after code-implementation-specialist to identify and plan cleanup of technical debt

5. **Codebase Organization**:
   - Use `codebase-organization-specialist` subagent after technical debt cleanup regardless of size
   - Run immediately after tech-debt-cleanup-planner to assess and improve code architecture

6. **Coverage Verification**:
   - Use `test-coverage-enforcer` subagent after code changes

7. **Server Cleanup**:
   - Kill development servers on ports 8000-8099, 3000-3099, 8080-8089  
   - Verify with `lsof -ti:8000,3000` that ports are free
   - Preserve database servers and persistent services

### TodoWrite Workflow Coordination - STRICT ENFORCEMENT
**MANDATORY**: When using TodoWrite checklists with planned subagent tasks, manual task overlap is STRICTLY PROHIBITED:

**✅ Correct Approach:**
- Plan subagents in TodoWrite (e.g., "Run pre-commit-quality-guard")  
- Let subagents handle their specialized tasks completely
- Avoid running individual commands manually when subagents will run them

**❌ Prohibited Actions:**
- Running ANY manual quality commands (`npm run typecheck`, `cargo test`, `npm run lint`, etc.) during development
- Executing git commands manually (`git add`, `git commit`, `git push`) when git-workflow-manager is available
- Creating commit messages manually when commit-message-specialist is available
- Running individual test commands when test-coverage-enforcer is available
- ANY manual execution of tasks that specialized subagents are designed to handle

**Implementation Examples:**
- ✅ Plan "Run pre-commit-quality-guard" → Let it handle ALL quality checks
- ❌ PROHIBITED: Run `npm test` manually then run `test-coverage-enforcer` later
- ✅ Plan "Run commit-message-specialist" → Let it generate the message
- ❌ PROHIBITED: Draft commit message manually then run `commit-message-specialist`
- ❌ PROHIBITED: Run `git add .` manually when git-workflow-manager is planned
- ❌ PROHIBITED: Run `cargo clippy` manually when pre-commit-quality-guard is planned

**WORKFLOW BLOCKING REQUIREMENT**: Task completion is BLOCKED until ALL planned subagents have been executed successfully. Manual completion of individual steps that subagents handle is a workflow violation.

### MANDATORY: Subagent Workflow Verification
**PRE-EXECUTION CHECKLIST**: Before starting ANY task involving code changes, the agent MUST:

1. **Identify Required Subagents**: Determine which subagents are needed based on the task scope
2. **Verify Availability**: Attempt to contact each required subagent to confirm availability
3. **Document Status**: Record subagent availability status in TodoWrite
4. **Halt if Unavailable**: If ANY required subagent is unavailable, STOP task execution immediately
5. **Get User Authorization**: Inform user of unavailability and wait for explicit authorization to proceed with manual fallback

**PROHIBITED SHORTCUTS**: The following actions are NEVER permitted when subagents are available:
- Running `cargo test`, `cargo clippy`, `cargo fmt` manually during development
- Running `npm run lint`, `npm run test`, `npm run typecheck` manually during development  
- Executing `git add`, `git commit`, `git push` manually when git-workflow-manager is available
- Creating commit messages manually when commit-message-specialist is available
- Running any individual command that a specialized subagent is designed to handle

**ENFORCEMENT**: Any violation of these requirements constitutes a critical workflow breach that must be immediately corrected.

### Emergency Procedures
- **If quality checks fail**: Do not commit until all issues are resolved
- **If subagents are unavailable**: HALT task execution, document the unavailability, and wait for user authorization before proceeding with manual fallback
- **If git operations fail**: Investigate authentication, network, or repository issues before retrying
- **If development servers won't stop**: Use `kill -9 <pid>` or `sudo lsof -ti:<port> | xargs kill -9` as last resort
- **If workflow violations occur**: Immediately revert changes and restart using proper subagent workflow

## Workflow Validation and Slash Command Policy - CRITICAL ENFORCEMENT

**BEFORE starting ANY task, the general-purpose agent MUST evaluate if it should use a specialized workflow:**

### Workflow Decision Process:
1. **Check the decision matrix** (see `.claude/workflow-decision-matrix.md`)
2. **If a slash command is indicated** (`/mr-code` or `/mr-policy`):
   - **STOP execution immediately**
   - **Inform the user** which slash command should be used
   - **Explain why** that approach is recommended  
   - **Wait for user** to execute the appropriate command
   - **DO NOT attempt to execute slash commands yourself**

3. **If direct implementation is appropriate**, proceed with subagent delegation

### CRITICAL: Slash Command Restriction
**The general-purpose agent must NEVER attempt to execute custom slash commands (`/mr-code`, `/mr-policy`).** These commands have specialized TodoWrite orchestration that only works when invoked by the user directly.

## Specialized Subagent Usage Policy - MANDATORY ENFORCEMENT
**CRITICAL REQUIREMENT**: The main Claude agent MUST USE specialized subagents for their designated tasks - they exist to ensure quality and consistency. Manual execution of subagent tasks is STRICTLY PROHIBITED.

**ZERO EXCEPTIONS**: Subagents must be used regardless of perceived overhead, complexity, or convenience. There are no circumstances where bypassing subagents is permitted.

**SUBAGENT AVAILABILITY VERIFICATION**: Before starting ANY task involving code changes, the agent MUST verify that required subagents are available. If subagents are unavailable, the task MUST be blocked until they become available or the user explicitly acknowledges the limitation and authorizes manual fallback.

**WORKFLOW VIOLATION RESPONSE**: If the agent bypasses mandatory subagent usage:
- IMMEDIATELY halt task execution
- Document the violation in TodoWrite
- Revert any changes made outside the subagent workflow
- Restart the task using proper subagent delegation

### MANDATORY Subagent Usage:
- **code-implementation-specialist**: For writing, editing, or creating code files for the Moodring project - handles all code implementation tasks including new features, modifications, database migrations, React Native components, and Rust backend code (does NOT handle testing, linting, or git operations)
- **pre-commit-quality-guard**: For significant changes (>5 files or new features) - enforces zero-tolerance quality standards
- **commit-message-specialist**: For ALL commit messages - ensures consistent template format and comprehensive descriptions
- **git-workflow-manager**: For git operations (staging, commit, push) - handles complete git workflow with proper verification; accepts pre-generated commit messages from commit-message-specialist
- **test-coverage-enforcer**: After writing/modifying code - verifies 80% minimum threshold requirement  
- **tech-debt-cleanup-planner**: For TODO: TEMP items - creates systematic removal strategies
- **claude-md-policy-analyst**: Before ANY CLAUDE.md changes - evaluates for conflicts and best practices
- **workflow-automation-analyst**: For repetitive manual tasks - evaluates workflow improvements

**Note**: Subagent usage is automatically handled by `/mr-code` and `/mr-policy` slash commands. Manual subagent calls are only needed for direct implementation tasks.

### CRITICAL: Task Execution Blocking Requirements
**MANDATORY WORKFLOW GATES**: The following requirements MUST be met before task completion:

1. **Pre-Task Verification**:
   - Verify all required subagents are available before starting any code changes
   - If subagents are unavailable, HALT execution and inform user
   - Document subagent availability status in TodoWrite

2. **During Development**:
   - NO manual execution of quality commands (npm test, cargo clippy, etc.)
   - NO manual git operations (git add, git commit, git push)
   - NO manual creation of commit messages
   - ALL individual commands must be delegated to appropriate subagents

3. **Task Completion Blocking**:
   - Task is NOT considered complete until ALL planned subagents have executed
   - Manual shortcuts that bypass subagent workflows are workflow violations
   - If a subagent fails, fix the underlying issue rather than bypassing with manual commands

4. **Violation Recovery Protocol**:
   - If manual commands are executed when subagents are available: HALT immediately
   - Revert any changes made outside the subagent workflow
   - Restart the task using proper subagent delegation
   - Document the violation and recovery steps in TodoWrite

## CLAUDE.md Change Evaluation
- **Before making ANY changes to CLAUDE.md**: Use `claude-md-policy-analyst` subagent to evaluate the proposed change for:
  - **Conflicts**: Does this contradict existing rules or create ambiguous situations?
  - **Potential issues**: Could this rule cause problems, be too restrictive, or create workflow bottlenecks?
  - **Best practices**: Is this aligned with software development best practices and team collaboration?
  - **Clarity**: Is the rule specific, actionable, and unambiguous?
  - **Enforceability**: Can this rule be consistently followed and verified?
- **Recommend improvements**: Suggest modifications to resolve conflicts or improve clarity
- **Flag concerns**: Explicitly mention any potential negative consequences or edge cases
- **Ensure consistency**: Verify new rules align with existing workflow and don't create contradictions

## Temporary Code Management
- **Mark temporary/test code explicitly**: Use `// TODO: TEMP -` comments for temporary code
- **Track temporary code in todos**: Add cleanup tasks to TodoWrite when creating temporary code
- **Clean up before moving to new features**: Remove all temporary code before starting new major features
- **Examples of temporary code**: Test endpoints, mock data, debug UI, placeholder components
- **Commit temporary code separately**: Use commit messages starting with "TEMP:" for easy identification

## Git Commit Template
```
Brief description of changes (imperative mood)

Detailed explanation of what was changed and why:
- Specific change 1
- Specific change 2
- Any breaking changes or important notes

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```