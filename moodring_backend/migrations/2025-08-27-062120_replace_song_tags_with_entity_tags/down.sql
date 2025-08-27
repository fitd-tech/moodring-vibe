-- Recreate the original song_tags table
CREATE TABLE song_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id VARCHAR NOT NULL,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    spotify_track_id VARCHAR,
    CONSTRAINT unique_user_song_tag UNIQUE (user_id, song_id, tag_id)
);

-- Recreate indexes for performance
CREATE INDEX idx_song_tags_user_id ON song_tags(user_id);
CREATE INDEX idx_song_tags_song_id ON song_tags(song_id);
CREATE INDEX idx_song_tags_tag_id ON song_tags(tag_id);

-- Migrate data back from entity_tags to song_tags (only track entities)
INSERT INTO song_tags (user_id, song_id, tag_id, created_at, spotify_track_id)
SELECT 
    user_id,
    entity_id as song_id,
    tag_id,
    created_at,
    CASE 
        WHEN spotify_id != entity_id THEN spotify_id 
        ELSE NULL 
    END as spotify_track_id
FROM entity_tags 
WHERE entity_type = 'track';

-- Drop the entity_tags table
DROP TABLE entity_tags;
