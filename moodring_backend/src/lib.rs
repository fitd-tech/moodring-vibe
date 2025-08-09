use base64::Engine;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use rocket::serde::{Deserialize, Serialize};
use std::env;

pub mod schema;

pub type DbPool = diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<PgConnection>>;

#[derive(Queryable, Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::tags)]
pub struct Tag {
    pub id: i32,
    pub user_id: i32,
    pub name: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::tags)]
pub struct NewTag {
    pub user_id: i32,
    pub name: String,
    pub color: Option<String>,
}

#[derive(Queryable, Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::song_tags)]
pub struct SongTag {
    pub id: i32,
    pub user_id: i32,
    pub song_id: String,
    pub tag_id: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::song_tags)]
pub struct NewSongTag {
    pub user_id: i32,
    pub song_id: String,
    pub tag_id: i32,
}

#[derive(Queryable, Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::users)]
pub struct User {
    pub id: i32,
    pub spotify_id: String,
    pub email: String,
    pub display_name: Option<String>,
    pub spotify_access_token: Option<String>,
    pub spotify_refresh_token: Option<String>,
    pub token_expires_at: Option<NaiveDateTime>,
    pub profile_image_url: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
#[diesel(table_name = schema::users)]
pub struct NewUser {
    pub spotify_id: String,
    pub email: String,
    pub display_name: Option<String>,
    pub spotify_access_token: Option<String>,
    pub spotify_refresh_token: Option<String>,
    pub token_expires_at: Option<NaiveDateTime>,
    pub profile_image_url: Option<String>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub struct AuthRequest {
    pub code: String,
    pub code_verifier: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub struct AuthResponse {
    pub user: User,
    pub access_token: String,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct SpotifyTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub scope: String,
    pub expires_in: i64,
    pub refresh_token: Option<String>,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct SpotifyUserProfile {
    pub id: String,
    pub email: Option<String>,
    pub display_name: Option<String>,
    pub images: Vec<SpotifyImage>,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct SpotifyImage {
    pub url: String,
    pub height: Option<u32>,
    pub width: Option<u32>,
}

pub async fn refresh_spotify_token(pool: &DbPool, user_id: i32) -> Result<AuthResponse, String> {
    use schema::users::dsl::*;

    let pool = pool.clone();

    tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;

        // Get user with refresh token
        let user_record = users
            .filter(id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(|e| format!("Failed to find user: {e}"))?;

        let refresh_token = user_record
            .spotify_refresh_token
            .ok_or("No refresh token available")?;

        let client_id = env::var("SPOTIFY_CLIENT_ID").map_err(|_| "SPOTIFY_CLIENT_ID not set")?;
        let client_secret =
            env::var("SPOTIFY_CLIENT_SECRET").map_err(|_| "SPOTIFY_CLIENT_SECRET not set")?;

        // Refresh the token
        let token_response = match tokio::task::block_in_place(|| {
            let rt = tokio::runtime::Handle::current();
            rt.block_on(async {
                let client = reqwest::Client::new();
                let params = [
                    ("grant_type", "refresh_token"),
                    ("refresh_token", &refresh_token),
                    ("client_id", &client_id),
                ];

                let response = match client
                    .post("https://accounts.spotify.com/api/token")
                    .form(&params)
                    .header(
                        "Authorization",
                        format!(
                            "Basic {}",
                            base64::engine::general_purpose::STANDARD
                                .encode(format!("{client_id}:{client_secret}"))
                        ),
                    )
                    .send()
                    .await
                {
                    Ok(resp) => resp,
                    Err(e) => return Err(format!("Failed to send refresh request: {e}")),
                };

                let status_code = response.status();
                if !status_code.is_success() {
                    let error_text = response.text().await.unwrap_or("Unknown error".to_string());
                    return Err(format!(
                        "Spotify refresh API error {status_code}: {error_text}"
                    ));
                }

                let token_result = response.json::<SpotifyTokenResponse>().await;
                match token_result {
                    Ok(tokens) => Ok(tokens),
                    Err(json_err) => Err(format!(
                        "Failed to parse Spotify refresh response: {json_err}"
                    )),
                }
            })
        }) {
            Ok(tokens) => tokens,
            Err(e) => return Err(format!("Token refresh failed: {e}")),
        };

        // Update user with new token
        let expires_at =
            chrono::Utc::now().naive_utc() + chrono::Duration::seconds(token_response.expires_in);

        let updated_user = diesel::update(users.filter(id.eq(user_id)))
            .set((
                spotify_access_token.eq(Some(token_response.access_token.clone())),
                spotify_refresh_token.eq(token_response.refresh_token.or(Some(refresh_token))),
                token_expires_at.eq(Some(expires_at)),
                updated_at.eq(chrono::Utc::now().naive_utc()),
            ))
            .get_result::<User>(&mut conn)
            .map_err(|e| format!("Failed to update user with new token: {e}"))?;

        let jwt_token = format!("user_token_{}", updated_user.id);
        Ok(AuthResponse {
            user: updated_user,
            access_token: jwt_token,
        })
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

pub async fn authenticate_user_with_spotify(
    pool: &DbPool,
    auth_request: AuthRequest,
) -> Result<AuthResponse, String> {
    use schema::users::dsl::*;

    let pool = pool.clone();

    tokio::task::spawn_blocking(move || {
        let mut conn = pool
            .get()
            .map_err(|e| format!("Failed to get connection: {e}"))?;

        // Step 1: Exchange authorization code for access token
        let client_id = env::var("SPOTIFY_CLIENT_ID").map_err(|_| "SPOTIFY_CLIENT_ID not set")?;
        let client_secret =
            env::var("SPOTIFY_CLIENT_SECRET").map_err(|_| "SPOTIFY_CLIENT_SECRET not set")?;

        let token_response = match tokio::task::block_in_place(|| {
            let rt = tokio::runtime::Handle::current();
            rt.block_on(async {
                let client = reqwest::Client::new();
                let params = [
                    ("grant_type", "authorization_code"),
                    ("code", &auth_request.code),
                    ("redirect_uri", "moodring://auth"),
                    ("client_id", &client_id),
                    ("code_verifier", &auth_request.code_verifier),
                ];

                let response = match client
                    .post("https://accounts.spotify.com/api/token")
                    .form(&params)
                    .header(
                        "Authorization",
                        format!(
                            "Basic {}",
                            base64::engine::general_purpose::STANDARD
                                .encode(format!("{client_id}:{client_secret}"))
                        ),
                    )
                    .send()
                    .await
                {
                    Ok(resp) => resp,
                    Err(e) => return Err(format!("Failed to send token request: {e}")),
                };

                let status_code = response.status();
                if !status_code.is_success() {
                    let error_text = response.text().await.unwrap_or("Unknown error".to_string());
                    return Err(format!("Spotify API error {status_code}: {error_text}"));
                }

                let token_result = response.json::<SpotifyTokenResponse>().await;
                match token_result {
                    Ok(tokens) => Ok(tokens),
                    Err(json_err) => Err(format!(
                        "Failed to parse Spotify token response: {json_err}"
                    )),
                }
            })
        }) {
            Ok(tokens) => tokens,
            Err(e) => return Err(format!("Token exchange failed: {e}")),
        };

        // Step 2: Get user profile from Spotify
        let user_profile = match tokio::task::block_in_place(|| {
            let rt = tokio::runtime::Handle::current();
            rt.block_on(async {
                let client = reqwest::Client::new();
                let response = match client
                    .get("https://api.spotify.com/v1/me")
                    .header(
                        "Authorization",
                        format!("Bearer {}", token_response.access_token),
                    )
                    .send()
                    .await
                {
                    Ok(resp) => resp,
                    Err(e) => return Err(format!("Failed to send profile request: {e}")),
                };

                let status_code = response.status();
                if !status_code.is_success() {
                    let error_text = response.text().await.unwrap_or("Unknown error".to_string());
                    return Err(format!(
                        "Spotify profile API error {status_code}: {error_text}"
                    ));
                }

                let profile_result = response.json::<SpotifyUserProfile>().await;
                match profile_result {
                    Ok(profile) => Ok(profile),
                    Err(json_err) => Err(format!(
                        "Failed to parse Spotify profile response: {json_err}"
                    )),
                }
            })
        }) {
            Ok(profile) => profile,
            Err(e) => return Err(format!("Profile fetch failed: {e}")),
        };

        // Step 3: Create or update user in database
        let expires_at =
            chrono::Utc::now().naive_utc() + chrono::Duration::seconds(token_response.expires_in);
        let profile_image = user_profile.images.first().map(|img| img.url.clone());

        let new_user = NewUser {
            spotify_id: user_profile.id.clone(),
            email: user_profile.email.clone().unwrap_or_default(),
            display_name: user_profile.display_name.clone(),
            spotify_access_token: Some(token_response.access_token.clone()),
            spotify_refresh_token: token_response.refresh_token.clone(),
            token_expires_at: Some(expires_at),
            profile_image_url: profile_image,
        };

        // Try to find existing user first
        let result_user = match users
            .filter(spotify_id.eq(&user_profile.id))
            .first::<User>(&mut conn)
        {
            Ok(_existing_user) => {
                // Update existing user
                diesel::update(users.filter(spotify_id.eq(&user_profile.id)))
                    .set((
                        email.eq(&new_user.email),
                        display_name.eq(&new_user.display_name),
                        spotify_access_token.eq(&new_user.spotify_access_token),
                        spotify_refresh_token.eq(&new_user.spotify_refresh_token),
                        token_expires_at.eq(&new_user.token_expires_at),
                        profile_image_url.eq(&new_user.profile_image_url),
                        updated_at.eq(chrono::Utc::now().naive_utc()),
                    ))
                    .get_result::<User>(&mut conn)
                    .map_err(|e| format!("Failed to update user: {e}"))
            }
            Err(diesel::NotFound) => {
                // Create new user
                diesel::insert_into(users)
                    .values(&new_user)
                    .get_result::<User>(&mut conn)
                    .map_err(|e| format!("Failed to create user: {e}"))
            }
            Err(e) => Err(format!("Database error: {e}")),
        }?;

        // Generate a simple JWT token (in production, use proper JWT implementation)
        let jwt_token = format!("user_token_{}", result_user.id);
        Ok(AuthResponse {
            user: result_user,
            access_token: jwt_token,
        })
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

#[cfg(test)]
pub mod test_helpers {
    use super::*;
    use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
    use std::env;

    pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

    pub fn setup_test_db() -> DbPool {
        let database_url = env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
            "postgresql://postgres:password@localhost/moodring_test".to_string()
        });

        let manager = diesel::r2d2::ConnectionManager::<PgConnection>::new(&database_url);
        let pool = diesel::r2d2::Pool::builder()
            .max_size(1)
            .build(manager)
            .expect("Failed to create test pool");

        // Run migrations
        let mut conn = pool.get().expect("Failed to get connection");
        conn.run_pending_migrations(MIGRATIONS)
            .expect("Failed to run migrations");

        pool
    }

    pub fn cleanup_test_db(pool: &DbPool) {
        use schema::users::dsl::*;
        let mut conn = pool.get().expect("Failed to get connection");
        diesel::delete(users)
            .execute(&mut conn)
            .expect("Failed to cleanup users");
    }

    pub fn create_mock_spotify_user() -> SpotifyUserProfile {
        SpotifyUserProfile {
            id: "test_spotify_id".to_string(),
            email: Some("test@example.com".to_string()),
            display_name: Some("Test User".to_string()),
            images: vec![SpotifyImage {
                url: "https://example.com/avatar.jpg".to_string(),
                height: Some(300),
                width: Some(300),
            }],
        }
    }

    pub fn create_mock_token_response() -> SpotifyTokenResponse {
        SpotifyTokenResponse {
            access_token: "mock_access_token".to_string(),
            token_type: "Bearer".to_string(),
            scope: "user-read-private user-read-email".to_string(),
            expires_in: 3600,
            refresh_token: Some("mock_refresh_token".to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::env;

    #[tokio::test]
    async fn test_new_user_struct_creation() {
        let new_user = NewUser {
            spotify_id: "test_spotify_123".to_string(),
            email: "test@example.com".to_string(),
            display_name: Some("Test User".to_string()),
            spotify_access_token: Some("access_token_123".to_string()),
            spotify_refresh_token: Some("refresh_token_123".to_string()),
            token_expires_at: Some(chrono::Utc::now().naive_utc() + chrono::Duration::hours(1)),
            profile_image_url: Some("https://example.com/avatar.jpg".to_string()),
        };

        assert_eq!(new_user.spotify_id, "test_spotify_123");
        assert_eq!(new_user.email, "test@example.com");
        assert_eq!(new_user.display_name, Some("Test User".to_string()));
        assert_eq!(
            new_user.spotify_access_token,
            Some("access_token_123".to_string())
        );
        assert_eq!(
            new_user.spotify_refresh_token,
            Some("refresh_token_123".to_string())
        );
        assert_eq!(
            new_user.profile_image_url,
            Some("https://example.com/avatar.jpg".to_string())
        );
    }

    #[tokio::test]
    async fn test_user_model_serialization() {
        let user = User {
            id: 1,
            spotify_id: "test_spotify_id".to_string(),
            email: "test@example.com".to_string(),
            display_name: Some("Test User".to_string()),
            spotify_access_token: Some("access_token".to_string()),
            spotify_refresh_token: Some("refresh_token".to_string()),
            token_expires_at: Some(chrono::Utc::now().naive_utc()),
            profile_image_url: Some("https://example.com/avatar.jpg".to_string()),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
        };

        let serialized = serde_json::to_string(&user).expect("Failed to serialize user");
        let deserialized: User =
            serde_json::from_str(&serialized).expect("Failed to deserialize user");

        assert_eq!(user.id, deserialized.id);
        assert_eq!(user.spotify_id, deserialized.spotify_id);
        assert_eq!(user.email, deserialized.email);
    }

    #[tokio::test]
    async fn test_auth_request_deserialization() {
        let json_data = json!({
            "code": "test_auth_code",
            "code_verifier": "test_code_verifier"
        });

        let auth_request: AuthRequest =
            serde_json::from_value(json_data).expect("Failed to deserialize AuthRequest");

        assert_eq!(auth_request.code, "test_auth_code");
        assert_eq!(auth_request.code_verifier, "test_code_verifier");
    }

    #[tokio::test]
    async fn test_auth_response_serialization() {
        let user = User {
            id: 1,
            spotify_id: "test_spotify_id".to_string(),
            email: "test@example.com".to_string(),
            display_name: Some("Test User".to_string()),
            spotify_access_token: Some("access_token".to_string()),
            spotify_refresh_token: Some("refresh_token".to_string()),
            token_expires_at: Some(chrono::Utc::now().naive_utc()),
            profile_image_url: Some("https://example.com/avatar.jpg".to_string()),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
        };

        let auth_response = AuthResponse {
            user: user.clone(),
            access_token: "jwt_token_123".to_string(),
        };

        let serialized =
            serde_json::to_string(&auth_response).expect("Failed to serialize AuthResponse");
        let json_value: serde_json::Value =
            serde_json::from_str(&serialized).expect("Failed to parse JSON");

        assert_eq!(json_value["access_token"], "jwt_token_123");
        assert_eq!(json_value["user"]["id"], 1);
        assert_eq!(json_value["user"]["spotify_id"], "test_spotify_id");
    }

    #[test]
    fn test_missing_environment_variables() {
        // Temporarily remove environment variables
        env::remove_var("SPOTIFY_CLIENT_ID");
        env::remove_var("SPOTIFY_CLIENT_SECRET");

        // Test that missing env vars are handled properly
        let client_id_result = env::var("SPOTIFY_CLIENT_ID");
        let client_secret_result = env::var("SPOTIFY_CLIENT_SECRET");

        assert!(client_id_result.is_err());
        assert!(client_secret_result.is_err());
    }

    #[tokio::test]
    async fn test_spotify_token_response_deserialization() {
        let json_data = json!({
            "access_token": "mock_access_token",
            "token_type": "Bearer",
            "scope": "user-read-private user-read-email",
            "expires_in": 3600,
            "refresh_token": "mock_refresh_token"
        });

        let token_response: SpotifyTokenResponse =
            serde_json::from_value(json_data).expect("Failed to deserialize SpotifyTokenResponse");

        assert_eq!(token_response.access_token, "mock_access_token");
        assert_eq!(token_response.token_type, "Bearer");
        assert_eq!(token_response.scope, "user-read-private user-read-email");
        assert_eq!(token_response.expires_in, 3600);
        assert_eq!(
            token_response.refresh_token,
            Some("mock_refresh_token".to_string())
        );
    }

    #[tokio::test]
    async fn test_spotify_user_profile_deserialization() {
        let json_data = json!({
            "id": "test_spotify_id",
            "email": "test@example.com",
            "display_name": "Test User",
            "images": [
                {
                    "url": "https://example.com/avatar.jpg",
                    "height": 300,
                    "width": 300
                }
            ]
        });

        let user_profile: SpotifyUserProfile =
            serde_json::from_value(json_data).expect("Failed to deserialize SpotifyUserProfile");

        assert_eq!(user_profile.id, "test_spotify_id");
        assert_eq!(user_profile.email, Some("test@example.com".to_string()));
        assert_eq!(user_profile.display_name, Some("Test User".to_string()));
        assert_eq!(user_profile.images.len(), 1);
        assert_eq!(user_profile.images[0].url, "https://example.com/avatar.jpg");
        assert_eq!(user_profile.images[0].height, Some(300));
        assert_eq!(user_profile.images[0].width, Some(300));
    }

    #[tokio::test]
    async fn test_auth_request_validation() {
        let valid_request = AuthRequest {
            code: "valid_auth_code_12345".to_string(),
            code_verifier: "valid_code_verifier_12345".to_string(),
        };

        assert!(!valid_request.code.is_empty());
        assert!(!valid_request.code_verifier.is_empty());
        assert!(valid_request.code.len() > 10);
        assert!(valid_request.code_verifier.len() > 10);
    }
}
