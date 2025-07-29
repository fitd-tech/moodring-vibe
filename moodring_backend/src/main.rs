#[macro_use]
extern crate rocket;

extern crate diesel;

use diesel::prelude::*;
use rocket::serde::{json::Json, Deserialize, Serialize};
use rocket::{tokio, State};
use std::env;

pub mod schema;

// TODO: TEMP - Remove this when moving to real features
type DbPool = diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<PgConnection>>;

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
                get_songs,
                create_song,
                update_song
            ],
        )
        .launch()
        .await
        .map_err(Box::new)?;

    Ok(())
}
