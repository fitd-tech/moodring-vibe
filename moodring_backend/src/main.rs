#[macro_use]
extern crate rocket;

extern crate diesel;

use diesel::prelude::*;
use rocket::serde::{json::Json, Deserialize, Serialize};
use rocket::{tokio, State};
use std::env;

use moodring_backend::*;

// TODO: TEMP - Remove this model when moving to real features
#[derive(Queryable, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::temp_songs)]
pub struct TempSong {
    pub id: i32,
    pub title: String,
    pub artist: String,
    pub genre: Option<String>,
    pub created_at: chrono::NaiveDateTime,
    pub updated_at: chrono::NaiveDateTime,
}

// TODO: TEMP - Remove this struct when moving to real features
#[derive(Insertable, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::temp_songs)]
pub struct NewTempSong {
    pub title: String,
    pub artist: String,
    pub genre: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct HealthResponse {
    status: String,
    message: String,
}

// TODO: TEMP - Remove this struct when removing test endpoint
#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct TestDataResponse {
    message: String,
    data: Vec<String>,
    timestamp: String,
}

#[get("/health")]
fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: "Moodring backend is running".to_string(),
    })
}

#[get("/")]
fn index() -> &'static str {
    "Welcome to Moodring API"
}

// TODO: TEMP - Remove this test endpoint when moving to real features
#[get("/test-data")]
fn test_data() -> Json<TestDataResponse> {
    use chrono::Utc;

    Json(TestDataResponse {
        message: "Hello from Moodring backend!".to_string(),
        data: vec![
            "🎵 Song 1: Bohemian Rhapsody".to_string(),
            "🎵 Song 2: Stairway to Heaven".to_string(),
            "🎵 Song 3: Hotel California".to_string(),
            "🎵 Song 4: Sweet Child O' Mine".to_string(),
        ],
        timestamp: Utc::now().to_rfc3339(),
    })
}

// TODO: TEMP - Remove these database endpoints when moving to real features
#[get("/songs")]
async fn get_songs(
    pool: &State<DbPool>,
) -> Result<Json<Vec<TempSong>>, rocket::response::status::BadRequest<String>> {
    use schema::temp_songs::dsl::*;

    let pool = pool.inner().clone();

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;
        temp_songs
            .load::<TempSong>(&mut conn)
            .map_err(|e| format!("Failed to load songs: {e}"))
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

#[post("/songs", data = "<new_song>")]
async fn create_song(
    pool: &State<DbPool>,
    new_song: Json<NewTempSong>,
) -> Result<Json<TempSong>, rocket::response::status::BadRequest<String>> {
    use schema::temp_songs::dsl::*;

    let pool = pool.inner().clone();
    let new_song_data = new_song.into_inner();

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;
        diesel::insert_into(temp_songs)
            .values(&new_song_data)
            .get_result::<TempSong>(&mut conn)
            .map_err(|e| format!("Failed to create song: {e}"))
    })
    .await
    {
        Ok(Ok(song)) => Ok(Json(song)),
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

#[put("/songs/<song_id>", data = "<updated_song>")]
async fn update_song(
    pool: &State<DbPool>,
    song_id: i32,
    updated_song: Json<NewTempSong>,
) -> Result<Json<TempSong>, rocket::response::status::BadRequest<String>> {
    use schema::temp_songs::dsl::*;

    let pool = pool.inner().clone();
    let updated_data = updated_song.into_inner();

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;
        diesel::update(temp_songs.filter(id.eq(song_id)))
            .set((
                title.eq(&updated_data.title),
                artist.eq(&updated_data.artist),
                genre.eq(&updated_data.genre),
                updated_at.eq(chrono::Utc::now().naive_utc()),
            ))
            .get_result::<TempSong>(&mut conn)
            .map_err(|e| format!("Failed to update song: {e}"))
    })
    .await
    {
        Ok(Ok(song)) => Ok(Json(song)),
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

#[delete("/songs/<song_id>")]
async fn delete_song(
    pool: &State<DbPool>,
    song_id: i32,
) -> Result<rocket::response::status::NoContent, rocket::response::status::BadRequest<String>> {
    use schema::temp_songs::dsl::*;

    let pool = pool.inner().clone();

    match tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;
        diesel::delete(temp_songs.filter(id.eq(song_id)))
            .execute(&mut conn)
            .map_err(|e| format!("Failed to delete song: {e}"))
    })
    .await
    {
        Ok(Ok(rows_affected)) => {
            if rows_affected > 0 {
                Ok(rocket::response::status::NoContent)
            } else {
                Err(rocket::response::status::BadRequest(
                    "Song not found".to_string(),
                ))
            }
        }
        Ok(Err(e)) => Err(rocket::response::status::BadRequest(e)),
        Err(e) => Err(rocket::response::status::BadRequest(format!(
            "Task join error: {e}"
        ))),
    }
}

// Authentication endpoint
#[post("/auth/spotify", data = "<auth_request>")]
async fn spotify_auth(
    pool: &State<DbPool>,
    auth_request: Json<AuthRequest>,
) -> Result<Json<AuthResponse>, rocket::response::status::BadRequest<String>> {
    let auth_data = auth_request.into_inner();
    match authenticate_user_with_spotify(pool.inner(), auth_data).await {
        Ok(auth_response) => Ok(Json(auth_response)),
        Err(e) => Err(rocket::response::status::BadRequest(e)),
    }
}

// Token refresh endpoint
#[post("/auth/refresh/<user_id>")]
async fn refresh_token(
    pool: &State<DbPool>,
    user_id: i32,
) -> Result<Json<AuthResponse>, rocket::response::status::BadRequest<String>> {
    match refresh_spotify_token(pool.inner(), user_id).await {
        Ok(auth_response) => Ok(Json(auth_response)),
        Err(e) => Err(rocket::response::status::BadRequest(e)),
    }
}

// Tag management endpoints
#[get("/users/<user_id>/tags")]
async fn get_user_tags(
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
async fn create_tag(
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
async fn delete_tag(
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
async fn get_song_tags(
    pool: &State<DbPool>,
    song_id: String,
    user_id: i32,
) -> Result<Json<Vec<Tag>>, rocket::response::status::BadRequest<String>> {
    use schema::song_tags::dsl;
    use schema::tags;

    let pool = pool.inner().clone();
    let query_user_id = user_id;

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
async fn add_tag_to_song(
    pool: &State<DbPool>,
    song_id: String,
    new_song_tag: Json<NewSongTag>,
) -> Result<Json<SongTag>, rocket::response::status::BadRequest<String>> {
    use schema::song_tags::dsl;

    let pool = pool.inner().clone();
    let mut new_song_tag_data = new_song_tag.into_inner();
    new_song_tag_data.song_id = song_id;

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
async fn remove_tag_from_song(
    pool: &State<DbPool>,
    song_id: String,
    tag_id: i32,
    user_id: i32,
) -> Result<rocket::response::status::NoContent, rocket::response::status::BadRequest<String>> {
    use schema::song_tags::dsl;

    let pool = pool.inner().clone();
    let query_user_id = user_id;
    let query_tag_id = tag_id;

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

#[tokio::main]
async fn main() -> Result<(), Box<rocket::Error>> {
    dotenvy::dotenv().ok();

    // TODO: TEMP - Remove database setup when moving to real features
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let manager = diesel::r2d2::ConnectionManager::<PgConnection>::new(database_url);
    let pool = diesel::r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create pool");

    let _rocket = rocket::build()
        .manage(pool)
        .mount(
            "/",
            routes![
                index,
                health,
                test_data,
                spotify_auth,
                refresh_token,
                get_songs,
                create_song,
                update_song,
                delete_song,
                get_user_tags,
                create_tag,
                delete_tag,
                get_song_tags,
                add_tag_to_song,
                remove_tag_from_song
            ],
        )
        .launch()
        .await
        .map_err(Box::new)?;

    Ok(())
}
