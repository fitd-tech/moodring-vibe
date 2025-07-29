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

## Persistent Rules
- Git commit after any completed task
- Never modify test files without explicit permission
- Follow existing code conventions and patterns
- Prioritize security best practices