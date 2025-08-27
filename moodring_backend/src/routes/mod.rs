pub mod auth;
pub mod health;
pub mod tags;

// Re-export all route handlers for easy mounting
pub use auth::{refresh_token, spotify_auth};
pub use health::{health as health_check, index};
pub use tags::{
    // New entity-based routes
    add_tag_to_entity,
    get_entity_tags,
    get_entities_with_tag,
    get_spotify_ids_with_tag,
    remove_tag_from_entity,
    // Backward compatibility routes
    add_tag_to_song_compat,
    get_song_tags_compat,
    get_spotify_track_ids_with_tag_compat,
    remove_tag_from_song_compat,
    // Tag management routes
    create_tag,
    delete_tag,
    get_user_tags,
};
