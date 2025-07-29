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
