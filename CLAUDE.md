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

## Persistent Rules - MANDATORY WORKFLOW
- **IMMEDIATELY after completing ANY task that creates, modifies, or deletes files**: 
  1. Run `git status` and `git diff` to review changes
  2. **Run pre-commit quality checks**:
     - **MANDATORY**: Use `pre-commit-quality-guard` subagent for significant changes (>5 files or new features)
     - Backend: `cargo test && cargo clippy && cargo fmt --check` (from moodring_backend/)
     - Frontend: `npm run lint && npm run test && npm run typecheck` (from moodring_frontend/, if scripts exist)
     - **FAIL COMMITS ON ANY WARNINGS**: Address all clippy warnings, lint warnings, and formatting issues before committing
     - **Zero tolerance for warnings**: No commits allowed with outstanding warnings or linting issues
  3. Stage task-related files with `git add` (review git status to ensure only intended changes are included)
  4. **Generate commit message**: MANDATORY use of `commit-message-specialist` subagent for ALL commits
  5. Commit with comprehensive message including 🤖 footer
  6. Push to working branch (develop/feature) with `git push origin <branch>` - NO EXCEPTIONS, every commit must be immediately pushed
  7. **Clean up development servers**: Kill any development servers started during the task
     - Backend servers (Rocket, cargo run, etc.) on ports 8000-8099
     - Frontend development servers (Expo, Metro, npm start) on ports 3000-3099, 8080-8089
     - **Exceptions**: Do NOT kill database servers, persistent services, or system processes
     - **Verification**: Run `lsof -ti:8000,3000` or similar to confirm ports are free
     - **Note**: This ensures the user can start their own development environment without port conflicts
- **NO EXCEPTIONS**: Every file change must be committed and pushed in the SAME response as the change
- **Never wait for user reminder**: Commit/push workflow is automatic after any file modification
- **If lint/test commands don't exist**: Ask user for correct commands and suggest adding them to package.json/Cargo.toml
- Always work on `develop` branch or feature branches (never commit directly to `main`)
- Always ask permission before pushing to `main` branch
- Never modify test files without explicit permission
- Follow existing code conventions and patterns
- Prioritize security best practices
- Write tests for all new code before committing
- Run test suite on every commit via git hooks
- Include comprehensive commit messages describing all changes made

## Specialized Subagent Usage Policy - CRITICAL ENFORCEMENT
**VERY IMPORTANT**: Always use specialized subagents for their designated tasks - they exist to ensure quality and consistency. The main Claude agent should STRONGLY PREFER delegating to subagents rather than performing specialized tasks directly.

**Exception Handling**: Only bypass subagents if they are unavailable, malfunctioning, or would create excessive overhead for trivial operations.

### MANDATORY Subagent Usage:
- **pre-commit-quality-guard**: MANDATORY for significant changes (>5 files or new features) to enforce zero-tolerance quality standards before commits
- **commit-message-specialist**: MANDATORY for ALL commit messages to ensure consistent template format and comprehensive descriptions
- **test-coverage-enforcer**: MANDATORY after writing/modifying code to verify 80% minimum threshold requirement  
- **tech-debt-cleanup-planner**: MANDATORY when dealing with TODO: TEMP items to create systematic removal strategies
- **claude-md-policy-analyst**: MANDATORY before making ANY changes to CLAUDE.md to evaluate for conflicts and best practices
- **workflow-automation-analyst**: MANDATORY when evaluating repetitive manual tasks or workflow improvements

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