-- Create the new entity_tags table
CREATE TABLE entity_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR NOT NULL CHECK (entity_type IN ('track', 'album', 'playlist')),
    entity_id VARCHAR NOT NULL,
    spotify_id VARCHAR NOT NULL,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_entity_tag UNIQUE (user_id, entity_type, entity_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_entity_tags_user_id ON entity_tags(user_id);
CREATE INDEX idx_entity_tags_entity_type_entity_id ON entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_spotify_id ON entity_tags(spotify_id);
CREATE INDEX idx_entity_tags_tag_id ON entity_tags(tag_id);
CREATE INDEX idx_entity_tags_user_entity_type ON entity_tags(user_id, entity_type);

-- Migrate existing data from song_tags to entity_tags
INSERT INTO entity_tags (user_id, entity_type, entity_id, spotify_id, tag_id, created_at)
SELECT 
    user_id,
    'track' as entity_type,
    song_id as entity_id,
    COALESCE(spotify_track_id, song_id) as spotify_id,
    tag_id,
    created_at
FROM song_tags;

-- Drop the old song_tags table
DROP TABLE song_tags;
