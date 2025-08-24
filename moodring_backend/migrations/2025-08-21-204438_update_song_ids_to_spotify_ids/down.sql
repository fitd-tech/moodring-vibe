-- Rollback the Spotify track ID changes

-- Drop the indexes first
DROP INDEX IF EXISTS idx_song_tags_user_spotify_track;
DROP INDEX IF EXISTS idx_song_tags_spotify_track_id;

-- Drop the new column
ALTER TABLE song_tags DROP COLUMN IF EXISTS spotify_track_id;
