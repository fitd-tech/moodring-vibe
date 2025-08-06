// @generated automatically by Diesel CLI.

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

diesel::allow_tables_to_appear_in_same_query!(temp_songs, users,);
