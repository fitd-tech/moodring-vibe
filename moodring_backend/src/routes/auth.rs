use crate::{
    authenticate_user_with_spotify, refresh_spotify_token, AuthRequest, AuthResponse, DbPool,
};
use rocket::serde::json::Json;
use rocket::State;

// Authentication endpoint
#[post("/auth/spotify", data = "<auth_request>")]
pub async fn spotify_auth(
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
pub async fn refresh_token(
    pool: &State<DbPool>,
    user_id: i32,
) -> Result<Json<AuthResponse>, rocket::response::status::BadRequest<String>> {
    match refresh_spotify_token(pool.inner(), user_id).await {
        Ok(auth_response) => Ok(Json(auth_response)),
        Err(e) => Err(rocket::response::status::BadRequest(e)),
    }
}
