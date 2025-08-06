CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL,
    display_name VARCHAR,
    spotify_access_token VARCHAR,
    spotify_refresh_token VARCHAR,
    token_expires_at TIMESTAMP,
    profile_image_url VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient lookups
CREATE INDEX idx_users_spotify_id ON users(spotify_id);
CREATE INDEX idx_users_email ON users(email);
