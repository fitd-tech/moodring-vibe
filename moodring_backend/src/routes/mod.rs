pub mod auth;
pub mod health;
pub mod tags;

// Re-export all route handlers for easy mounting
pub use auth::{refresh_token, spotify_auth};
pub use health::{health as health_check, index};
pub use tags::{
    add_tag_to_song, create_tag, delete_tag, get_song_tags, get_songs_with_tag, get_user_tags,
    remove_tag_from_song,
};
