#[macro_use] extern crate rocket;

use rocket::serde::{Deserialize, Serialize, json::Json};
use rocket::tokio;

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct HealthResponse {
    status: String,
    message: String,
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

#[tokio::main]
async fn main() -> Result<(), rocket::Error> {
    dotenvy::dotenv().ok();
    
    let _rocket = rocket::build()
        .mount("/", routes![index, health])
        .launch()
        .await?;

    Ok(())
}