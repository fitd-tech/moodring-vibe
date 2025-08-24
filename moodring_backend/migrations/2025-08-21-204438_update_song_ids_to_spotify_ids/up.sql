-- This migration updates the song_tags table to support both normalized and Spotify IDs
-- Since we need to maintain existing data, we'll add a new column and migrate incrementally

-- Add a new column for Spotify track IDs
ALTER TABLE song_tags ADD COLUMN spotify_track_id VARCHAR;

-- Add an index for the new Spotify track ID column
CREATE INDEX idx_song_tags_spotify_track_id ON song_tags(spotify_track_id);

-- Add a composite index for user_id and spotify_track_id for efficient queries
CREATE INDEX idx_song_tags_user_spotify_track ON song_tags(user_id, spotify_track_id);

-- Note: The existing song_id column will remain for backwards compatibility
-- and to allow for gradual migration of existing data
