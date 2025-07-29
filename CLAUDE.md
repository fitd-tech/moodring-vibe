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
- **Style**: 90's retro colorful interface (Trapper Keepers/neon aesthetic)

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
  2. **Run pre-commit checks**:
     - Backend: `cargo test && cargo clippy && cargo fmt --check` (from moodring_backend/)
     - Frontend: `npm run lint && npm run test && npm run typecheck` (from moodring_frontend/, if scripts exist)
  3. Add files with `git add`
  4. Commit with comprehensive message including 🤖 footer
  5. Push to working branch (develop/feature) with `git push origin <branch>`
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