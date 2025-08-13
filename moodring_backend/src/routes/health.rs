use rocket::serde::{json::Json, Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
pub struct HealthResponse {
    pub status: String,
    pub message: String,
}

#[get("/health")]
pub fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: "Moodring backend is running".to_string(),
    })
}

#[get("/")]
pub fn index() -> &'static str {
    "Welcome to Moodring API"
}
