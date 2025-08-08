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
- **Clean server state**: Kill development servers after task completion (ports 3000-3099, 8000-8099)
- **Database preservation**: Never kill database servers or persistent services
- **Test file protection**: Never modify test files without explicit permission

### Task Execution Policy
- **For development tasks requiring file changes**: Use `/mr-code` slash command for comprehensive quality-enforced workflows
- **For policy/workflow changes**: Use `/mr-policy` slash command for proper analysis and validation
- **For information-only tasks**: Direct implementation is appropriate
- **Fallback enforcement**: When slash commands are unavailable, manually execute equivalent quality checks using the fallback checklist below
- **Command availability check**: If you cannot use slash commands, inform the user and proceed with fallback enforcement
- **TodoWrite subagent coordination**: When subagents are planned in TodoWrite workflows, do NOT perform overlapping tasks manually to avoid redundancy and ensure proper workflow orchestration

### Manual Quality Checklist (Fallback Only)
*Use only when specialized slash commands are unavailable:*

1. **Pre-commit Quality Checks**:
   - Backend: `cargo test && cargo clippy && cargo fmt --check` (from moodring_backend/)
   - Frontend: `npm run lint && npm run test && npm run typecheck` (from moodring_frontend/)
   - Use `pre-commit-quality-guard` subagent for significant changes (>5 files or new features)

2. **Commit Process**:
   - Use `commit-message-specialist` subagent for commit message generation
   - Pass the generated commit message to `git-workflow-manager` subagent for complete git workflow (staging, commit, push)
   - Alternative manual approach (only if subagents unavailable):
     - Stage specific files with `git add <file>` (avoid `git add .`)
     - Verify staging with `git status` and `git diff --cached`  
     - Use `commit-message-specialist` subagent for commit message generation
     - Push immediately with `git push origin <branch>`

3. **Coverage and Organization**:
   - Use `test-coverage-enforcer` subagent after code changes
   - Use `codebase-organization-specialist` subagent for architectural changes
   - Use `tech-debt-cleanup-planner` subagent for TODO: TEMP items

4. **Server Cleanup**:
   - Kill development servers on ports 8000-8099, 3000-3099, 8080-8089  
   - Verify with `lsof -ti:8000,3000` that ports are free
   - Preserve database servers and persistent services

### TodoWrite Workflow Coordination
**CRITICAL**: When using TodoWrite checklists with planned subagent tasks, avoid manual task overlap:

**✅ Correct Approach:**
- Plan subagents in TodoWrite (e.g., "Run pre-commit-quality-guard")  
- Let subagents handle their specialized tasks completely
- Avoid running individual commands manually when subagents will run them

**❌ Incorrect Approach:**
- Running `npm run typecheck` manually during implementation
- Then later running `pre-commit-quality-guard` (which also runs typecheck)
- Creates redundancy and bypasses comprehensive subagent quality checks

**Implementation Examples:**
- ✅ Plan "Run pre-commit-quality-guard" → Let it handle all quality checks
- ❌ Run `npm test` manually → Then run `test-coverage-enforcer` later
- ✅ Plan "Run commit-message-specialist" → Let it generate the message
- ❌ Draft commit message manually → Then run `commit-message-specialist`

### Emergency Procedures
- **If quality checks fail**: Do not commit until all issues are resolved
- **If subagents are unavailable**: Document the limitation and proceed with manual validation
- **If git operations fail**: Investigate authentication, network, or repository issues before retrying
- **If development servers won't stop**: Use `kill -9 <pid>` or `sudo lsof -ti:<port> | xargs kill -9` as last resort

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

## Specialized Subagent Usage Policy - CRITICAL ENFORCEMENT
**VERY IMPORTANT**: Always use specialized subagents for their designated tasks - they exist to ensure quality and consistency. The main Claude agent should STRONGLY PREFER delegating to subagents rather than performing specialized tasks directly.

**Exception Handling**: Only bypass subagents if they are unavailable, malfunctioning, or would create excessive overhead for trivial operations.

### MANDATORY Subagent Usage:
- **pre-commit-quality-guard**: For significant changes (>5 files or new features) - enforces zero-tolerance quality standards
- **commit-message-specialist**: For ALL commit messages - ensures consistent template format and comprehensive descriptions
- **git-workflow-manager**: For git operations (staging, commit, push) - handles complete git workflow with proper verification; accepts pre-generated commit messages from commit-message-specialist
- **test-coverage-enforcer**: After writing/modifying code - verifies 80% minimum threshold requirement  
- **tech-debt-cleanup-planner**: For TODO: TEMP items - creates systematic removal strategies
- **claude-md-policy-analyst**: Before ANY CLAUDE.md changes - evaluates for conflicts and best practices
- **workflow-automation-analyst**: For repetitive manual tasks - evaluates workflow improvements

**Note**: Subagent usage is automatically handled by `/mr-code` and `/mr-policy` slash commands. Manual subagent calls are only needed for direct implementation tasks.

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