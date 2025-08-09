// @generated automatically by Diesel CLI.

diesel::table! {
    song_tags (id) {
        id -> Int4,
        user_id -> Int4,
        song_id -> Varchar,
        tag_id -> Int4,
        created_at -> Timestamp,
    }
}

diesel::table! {
    tags (id) {
        id -> Int4,
        user_id -> Int4,
        name -> Varchar,
        color -> Nullable<Varchar>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    temp_songs (id) {
        id -> Int4,
        title -> Varchar,
        artist -> Varchar,
        genre -> Nullable<Varchar>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    users (id) {
        id -> Int4,
        spotify_id -> Varchar,
        email -> Varchar,
        display_name -> Nullable<Varchar>,
        spotify_access_token -> Nullable<Varchar>,
        spotify_refresh_token -> Nullable<Varchar>,
        token_expires_at -> Nullable<Timestamp>,
        profile_image_url -> Nullable<Varchar>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::joinable!(song_tags -> tags (tag_id));
diesel::joinable!(song_tags -> users (user_id));
diesel::joinable!(tags -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(song_tags, tags, temp_songs, users,);
