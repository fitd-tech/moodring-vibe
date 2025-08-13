use crate::{schema, DbPool, NewSongTag, NewTag, SongTag, Tag};
use diesel::prelude::*;
use rocket::serde::json::Json;
use rocket::tokio;
use rocket::State;

// Tag management endpoints
#[get("/users/<user_id>/tags")]
pub async fn get_user_tags(
    pool: &State<DbPool>,
    user_id: i32,
) -> Result<Json<Vec<Tag>>, rocket::response::status::BadRequest<String>> {
    use schema::tags::dsl;

    let pool = pool.inner().clone();
    let query_user_id = user_id;

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;
        dsl::tags
            .filter(dsl::user_id.eq(query_user_id))
            .order(dsl::name.asc())
            .load::<Tag>(&mut conn)
            .map_err(|e| format!("Failed to load tags: {e}"))
    })
    .await
    {
        Ok(Ok(user_tags)) => Ok(Json(user_tags)),
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

#[post("/users/<user_id>/tags", data = "<new_tag>")]
pub async fn create_tag(
    pool: &State<DbPool>,
    user_id: i32,
    new_tag: Json<NewTag>,
) -> Result<Json<Tag>, rocket::response::status::BadRequest<String>> {
    use schema::tags::dsl;

    let pool = pool.inner().clone();
    let mut new_tag_data = new_tag.into_inner();
    new_tag_data.user_id = user_id;

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;
        diesel::insert_into(dsl::tags)
            .values(&new_tag_data)
            .get_result::<Tag>(&mut conn)
            .map_err(|e| format!("Failed to create tag: {e}"))
    })
    .await
    {
        Ok(Ok(tag)) => Ok(Json(tag)),
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

#[delete("/users/<user_id>/tags/<tag_id>")]
pub async fn delete_tag(
    pool: &State<DbPool>,
    user_id: i32,
    tag_id: i32,
) -> Result<rocket::response::status::NoContent, rocket::response::status::BadRequest<String>> {
    use schema::tags::dsl;

    let pool = pool.inner().clone();
    let query_user_id = user_id;
    let query_tag_id = tag_id;

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;
        diesel::delete(
            dsl::tags.filter(dsl::id.eq(query_tag_id).and(dsl::user_id.eq(query_user_id))),
        )
        .execute(&mut conn)
        .map_err(|e| format!("Failed to delete tag: {e}"))
    })
    .await
    {
        Ok(Ok(rows_affected)) => {
            if rows_affected > 0 {
                Ok(rocket::response::status::NoContent)
            } else {
                Err(rocket::response::status::BadRequest(
                    "Tag not found or not owned by user".to_string(),
                ))
            }
        }
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

// Song tagging endpoints
#[get("/songs/<song_id>/tags?<user_id>")]
pub async fn get_song_tags(
    pool: &State<DbPool>,
    song_id: &str,
    user_id: i32,
) -> Result<Json<Vec<Tag>>, rocket::response::status::BadRequest<String>> {
    use schema::song_tags::dsl;
    use schema::tags;

    let pool = pool.inner().clone();
    let query_user_id = user_id;
    let song_id = song_id.to_string();

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;

        dsl::song_tags
            .inner_join(tags::table)
            .filter(
                dsl::song_id
                    .eq(&song_id)
                    .and(dsl::user_id.eq(query_user_id)),
            )
            .select(tags::all_columns)
            .load::<Tag>(&mut conn)
            .map_err(|e| format!("Failed to load song tags: {e}"))
    })
    .await
    {
        Ok(Ok(tags)) => Ok(Json(tags)),
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

#[post("/songs/<song_id>/tags", data = "<new_song_tag>")]
pub async fn add_tag_to_song(
    pool: &State<DbPool>,
    song_id: &str,
    new_song_tag: Json<NewSongTag>,
) -> Result<Json<SongTag>, rocket::response::status::BadRequest<String>> {
    use schema::song_tags::dsl;

    let pool = pool.inner().clone();
    let mut new_song_tag_data = new_song_tag.into_inner();
    // Use the song_id from the URL path, not from the POST body
    new_song_tag_data.song_id = song_id.to_string();

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;

        diesel::insert_into(dsl::song_tags)
            .values(&new_song_tag_data)
            .get_result::<SongTag>(&mut conn)
            .map_err(|e| format!("Failed to add tag to song: {e}"))
    })
    .await
    {
        Ok(Ok(song_tag)) => Ok(Json(song_tag)),
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

#[delete("/songs/<song_id>/tags/<tag_id>?<user_id>")]
pub async fn remove_tag_from_song(
    pool: &State<DbPool>,
    song_id: &str,
    tag_id: i32,
    user_id: i32,
) -> Result<rocket::response::status::NoContent, rocket::response::status::BadRequest<String>> {
    use schema::song_tags::dsl;

    let pool = pool.inner().clone();
    let query_user_id = user_id;
    let query_tag_id = tag_id;
    let song_id = song_id.to_string();

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;

        diesel::delete(
            dsl::song_tags.filter(
                dsl::song_id
                    .eq(&song_id)
                    .and(dsl::tag_id.eq(query_tag_id))
                    .and(dsl::user_id.eq(query_user_id)),
            ),
        )
        .execute(&mut conn)
        .map_err(|e| format!("Failed to remove tag from song: {e}"))
    })
    .await
    {
        Ok(Ok(rows_affected)) => {
            if rows_affected > 0 {
                Ok(rocket::response::status::NoContent)
            } else {
                Err(rocket::response::status::BadRequest(
                    "Song tag not found or not owned by user".to_string(),
                ))
            }
        }
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

// Get songs that have a specific tag
#[get("/users/<user_id>/tags/<tag_id>/songs")]
pub async fn get_songs_with_tag(
    pool: &State<DbPool>,
    user_id: i32,
    tag_id: i32,
) -> Result<Json<Vec<String>>, rocket::response::status::BadRequest<String>> {
    use schema::song_tags::dsl;

    let pool = pool.inner().clone();
    let query_user_id = user_id;
    let query_tag_id = tag_id;

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;

        dsl::song_tags
            .filter(
                dsl::user_id
                    .eq(query_user_id)
                    .and(dsl::tag_id.eq(query_tag_id)),
            )
            .select(dsl::song_id)
            .load::<String>(&mut conn)
            .map_err(|e| format!("Failed to load songs with tag: {e}"))
    })
    .await
    {
        Ok(Ok(songs)) => Ok(Json(songs)),
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}
