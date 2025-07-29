#[macro_use]
extern crate rocket;

use rocket::serde::{json::Json, Deserialize, Serialize};
use rocket::tokio;

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct HealthResponse {
    status: String,
    message: String,
}

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

#[tokio::main]
async fn main() -> Result<(), rocket::Error> {
    dotenvy::dotenv().ok();

    let _rocket = rocket::build()
        .mount("/", routes![index, health, test_data])
        .launch()
        .await?;

    Ok(())
}
