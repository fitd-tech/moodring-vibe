# Moodring 🎵

A multi-platform app that integrates with Spotify to provide a new way to organize music through robust hierarchical tags.

## Features

- Share songs/playlists from Spotify to Moodring
- Assign hierarchical tags to songs and playlists
- Create custom playlists by combining/excluding tags
- Save generated playlists back to Spotify
- 90's retro colorful interface with light/dark mode support

## Tech Stack

- **Backend**: Rust + Rocket + PostgreSQL + Diesel ORM
- **Frontend**: Expo Go + React Native + TypeScript + TailwindCSS
- **Infrastructure**: Google Cloud Platform + Terraform

## Local Development Setup

### Prerequisites

- **Rust** (latest stable version via [rustup](https://rustup.rs/))
- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **PostgreSQL** (for backend database)
- **Expo CLI**: `npm install -g @expo/cli`

### Backend Setup (Rust + Rocket)

1. **Navigate to backend directory:**
   ```bash
   cd moodring_backend
   ```

2. **Install Rust dependencies:**
   ```bash
   cargo build
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file in moodring_backend/
   echo "DATABASE_URL=postgresql://username:password@localhost/moodring_db" > .env
   ```

4. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb moodring_db
   
   # Run migrations (when available)
   diesel migration run
   ```

5. **Start the backend server:**
   ```bash
   cargo run
   ```
   The backend will run on `http://localhost:8000` (default Rocket port)

### Frontend Setup (Expo + React Native)

1. **Navigate to frontend directory:**
   ```bash
   cd moodring_frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   # For all platforms
   npm start
   
   # Or specific platforms:
   npm run ios      # iOS simulator
   npm run android  # Android emulator
   npm run web      # Web browser
   ```

4. **Access the app:**
   - Scan QR code with Expo Go app on your mobile device
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

### Development Workflow

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd moodring_backend && cargo run
   
   # Terminal 2 - Frontend
   cd moodring_frontend && npm start
   ```

2. **Backend API will be available at:** `http://localhost:8000`
3. **Frontend will be available via Expo dev tools**

## Project Structure

```
moodring-vibe/
├── moodring_backend/     # Rust backend server
│   ├── src/
│   ├── Cargo.toml
│   └── Cargo.lock
├── moodring_frontend/    # React Native frontend
│   ├── App.tsx
│   ├── package.json
│   └── assets/
└── CLAUDE.md            # Development guidelines
```

## Development Guidelines

- Work on `develop` branch (never commit directly to `main`)
- Git commit after every completed task
- All code must have test coverage (minimum 80%)
- Follow existing code conventions and patterns
- Run linting and type checking before commits

## Git Workflow

- **Primary development**: `develop` branch
- **Production**: `main` branch (CI/CD only)
- **Features**: Create from `develop`, merge back via PRs

## License

[License information to be added]