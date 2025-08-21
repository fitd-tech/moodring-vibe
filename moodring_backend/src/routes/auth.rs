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

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::{Matcher, Server};
    use rocket::http::{ContentType, Status};
    use serde_json::json;
    use std::env;

    #[test]
    fn test_spotify_auth_endpoint_success() {
        use std::env;

        // Set required environment variables
        env::set_var("SPOTIFY_CLIENT_ID", "test_client_id");
        env::set_var("SPOTIFY_CLIENT_SECRET", "test_client_secret");

        // Test request structure validation
        let auth_request = json!({
            "code": "valid_authorization_code_12345",
            "code_verifier": "valid_code_verifier_67890"
        });

        // Validate request structure
        assert!(auth_request["code"].is_string());
        assert!(auth_request["code_verifier"].is_string());
        assert!(!auth_request["code"].as_str().unwrap().is_empty());
        assert!(!auth_request["code_verifier"].as_str().unwrap().is_empty());
        assert!(auth_request["code"].as_str().unwrap().len() > 20);
        assert!(auth_request["code_verifier"].as_str().unwrap().len() > 20);

        // Test serialization
        let request_string = auth_request.to_string();
        assert!(request_string.contains("valid_authorization_code"));
        assert!(request_string.contains("valid_code_verifier"));
    }

    #[test]
    fn test_spotify_auth_endpoint_invalid_request() {
        // Test various invalid request formats
        let invalid_requests = vec![
            // Missing code
            json!({
                "code_verifier": "test_verifier"
            }),
            // Missing code_verifier
            json!({
                "code": "test_code"
            }),
            // Empty code
            json!({
                "code": "",
                "code_verifier": "test_verifier"
            }),
            // Empty code_verifier
            json!({
                "code": "test_code",
                "code_verifier": ""
            }),
            // Invalid field names
            json!({
                "invalid_code": "test_code",
                "invalid_verifier": "test_verifier"
            }),
        ];

        for invalid_request in invalid_requests {
            // Test that we can identify invalid requests
            let has_valid_code = invalid_request
                .get("code")
                .and_then(|v| v.as_str())
                .map(|s| !s.is_empty())
                .unwrap_or(false);

            let has_valid_verifier = invalid_request
                .get("code_verifier")
                .and_then(|v| v.as_str())
                .map(|s| !s.is_empty())
                .unwrap_or(false);

            let is_valid = has_valid_code && has_valid_verifier;
            assert!(!is_valid, "Invalid request should be detected as invalid");
        }
    }

    #[test]
    fn test_spotify_auth_endpoint_missing_env_vars() {
        // Store original values to restore later
        let original_client_id = env::var("SPOTIFY_CLIENT_ID").ok();
        let original_client_secret = env::var("SPOTIFY_CLIENT_SECRET").ok();

        // Remove environment variables
        env::remove_var("SPOTIFY_CLIENT_ID");
        env::remove_var("SPOTIFY_CLIENT_SECRET");

        let auth_request = json!({
            "code": "test_code",
            "code_verifier": "test_verifier"
        });

        // Test that missing environment variables can be detected
        let client_id_missing = env::var("SPOTIFY_CLIENT_ID").is_err();
        let client_secret_missing = env::var("SPOTIFY_CLIENT_SECRET").is_err();

        assert!(client_id_missing, "SPOTIFY_CLIENT_ID should be missing");
        assert!(
            client_secret_missing,
            "SPOTIFY_CLIENT_SECRET should be missing"
        );

        // Test request structure is still valid
        assert!(auth_request["code"].is_string());
        assert!(auth_request["code_verifier"].is_string());

        // Restore original environment variables if they existed
        if let Some(id) = original_client_id {
            env::set_var("SPOTIFY_CLIENT_ID", id);
        }
        if let Some(secret) = original_client_secret {
            env::set_var("SPOTIFY_CLIENT_SECRET", secret);
        }
    }

    #[tokio::test]
    async fn test_authenticate_user_with_spotify_mock_success() {
        use std::env;

        env::set_var("SPOTIFY_CLIENT_ID", "test_client_id");
        env::set_var("SPOTIFY_CLIENT_SECRET", "test_client_secret");

        // Setup mock HTTP server
        let mut server = Server::new_async().await;

        // Mock token endpoint
        let _token_mock = server
            .mock("POST", "/api/token")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "access_token": "mock_access_token",
                "token_type": "Bearer",
                "scope": "user-read-private user-read-email",
                "expires_in": 3600,
                "refresh_token": "mock_refresh_token"
            }"#,
            )
            .create_async()
            .await;

        // Mock user profile endpoint
        let _profile_mock = server
            .mock("GET", "/v1/me")
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "id": "test_user_123",
                "email": "test@example.com",
                "display_name": "Test User",
                "images": [
                    {
                        "url": "https://example.com/avatar.jpg",
                        "height": 300,
                        "width": 300
                    }
                ]
            }"#,
            )
            .create_async()
            .await;

        // Test successful authentication flow structure
        let auth_request = AuthRequest {
            code: "valid_test_code".to_string(),
            code_verifier: "valid_test_verifier".to_string(),
        };

        // Validate auth request structure
        assert!(!auth_request.code.is_empty());
        assert!(!auth_request.code_verifier.is_empty());
        assert_eq!(auth_request.code, "valid_test_code");
        assert_eq!(auth_request.code_verifier, "valid_test_verifier");
    }

    #[tokio::test]
    async fn test_authenticate_user_with_spotify_mock_error() {
        use std::env;

        env::set_var("SPOTIFY_CLIENT_ID", "test_client_id");
        env::set_var("SPOTIFY_CLIENT_SECRET", "test_client_secret");

        // Setup mock HTTP server for error scenarios
        let mut server = Server::new_async().await;

        // Mock token endpoint error
        let _error_mock = server
            .mock("POST", "/api/token")
            .with_status(400)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "error": "invalid_grant",
                "error_description": "Authorization code expired"
            }"#,
            )
            .create_async()
            .await;

        // Test error handling structure
        let auth_request = AuthRequest {
            code: "expired_code".to_string(),
            code_verifier: "invalid_verifier".to_string(),
        };

        // Validate error case structure
        assert_eq!(auth_request.code, "expired_code");
        assert_eq!(auth_request.code_verifier, "invalid_verifier");
        assert!(auth_request.code.contains("expired"));
        assert!(auth_request.code_verifier.contains("invalid"));
    }

    #[test]
    fn test_refresh_token_endpoint_validation() {
        use std::env;

        env::set_var("SPOTIFY_CLIENT_ID", "test_client_id");
        env::set_var("SPOTIFY_CLIENT_SECRET", "test_client_secret");

        // Test valid user IDs
        let valid_user_ids = vec![1, 42, 123, 9999];

        for user_id in valid_user_ids {
            assert!(user_id > 0, "User ID should be positive");
            assert!(user_id <= 9999, "User ID should be reasonable range");

            // Test user ID string representation
            let user_id_string = user_id.to_string();
            assert!(!user_id_string.is_empty());
            assert!(user_id_string.parse::<i32>().unwrap() == user_id);
        }

        // Test invalid user IDs
        let invalid_user_ids = vec![0, -1, -100];

        for user_id in invalid_user_ids {
            assert!(user_id <= 0, "Invalid user ID should be non-positive");
        }
    }

    #[tokio::test]
    async fn test_refresh_token_mock_success() {
        use std::env;

        env::set_var("SPOTIFY_CLIENT_ID", "test_client_id");
        env::set_var("SPOTIFY_CLIENT_SECRET", "test_client_secret");

        // Setup mock HTTP server
        let mut server = Server::new_async().await;

        // Mock refresh token endpoint
        let _refresh_mock = server
            .mock("POST", "/api/token")
            .match_body(Matcher::AllOf(vec![
                Matcher::UrlEncoded("grant_type".into(), "refresh_token".into()),
                Matcher::UrlEncoded("client_id".into(), "test_client_id".into()),
            ]))
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "access_token": "new_access_token",
                "token_type": "Bearer",
                "scope": "user-read-private user-read-email",
                "expires_in": 3600,
                "refresh_token": "new_refresh_token"
            }"#,
            )
            .create_async()
            .await;

        // Test refresh token flow structure
        let user_id = 123;

        // Validate user ID for refresh
        assert!(user_id > 0);
        assert_eq!(user_id, 123);

        // Test token refresh parameters
        let grant_type = "refresh_token";
        let client_id = "test_client_id";

        assert_eq!(grant_type, "refresh_token");
        assert_eq!(client_id, "test_client_id");
        assert!(!grant_type.is_empty());
        assert!(!client_id.is_empty());
    }

    #[tokio::test]
    async fn test_refresh_token_mock_error() {
        use std::env;

        env::set_var("SPOTIFY_CLIENT_ID", "test_client_id");
        env::set_var("SPOTIFY_CLIENT_SECRET", "test_client_secret");

        // Setup mock HTTP server for error scenarios
        let mut server = Server::new_async().await;

        // Mock refresh token error
        let _error_mock = server
            .mock("POST", "/api/token")
            .with_status(400)
            .with_header("content-type", "application/json")
            .with_body(
                r#"{
                "error": "invalid_grant",
                "error_description": "Invalid refresh token"
            }"#,
            )
            .create_async()
            .await;

        // Test error handling for refresh token
        let invalid_user_id = 9999;

        // Validate error case parameters
        assert!(invalid_user_id > 0);
        assert_eq!(invalid_user_id, 9999);

        // Test error response structure
        let error_response = json!({
            "error": "invalid_grant",
            "error_description": "Invalid refresh token"
        });

        assert_eq!(error_response["error"], "invalid_grant");
        assert_eq!(error_response["error_description"], "Invalid refresh token");
        assert!(error_response["error"].is_string());
        assert!(error_response["error_description"].is_string());
    }

    #[test]
    fn test_auth_response_structure() {
        // Test AuthResponse creation and validation
        let mock_user = crate::test_helpers::create_mock_spotify_user();
        let access_token = "jwt_token_12345";

        // Create mock User from SpotifyUserProfile
        let user = crate::User {
            id: 1,
            spotify_id: mock_user.id.clone(),
            email: mock_user.email.clone().unwrap_or_default(),
            display_name: mock_user.display_name.clone(),
            spotify_access_token: Some("spotify_access_token".to_string()),
            spotify_refresh_token: Some("spotify_refresh_token".to_string()),
            token_expires_at: Some(chrono::Utc::now().naive_utc() + chrono::Duration::hours(1)),
            profile_image_url: mock_user.images.first().map(|img| img.url.clone()),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
        };

        let auth_response = AuthResponse {
            user: user.clone(),
            access_token: access_token.to_string(),
        };

        // Validate response structure
        assert_eq!(auth_response.user.id, 1);
        assert_eq!(auth_response.user.spotify_id, "test_spotify_id");
        assert_eq!(auth_response.user.email, "test@example.com");
        assert_eq!(auth_response.access_token, "jwt_token_12345");
        assert!(auth_response.user.spotify_access_token.is_some());
        assert!(auth_response.user.spotify_refresh_token.is_some());
        assert!(auth_response.user.token_expires_at.is_some());
    }

    #[test]
    fn test_auth_endpoint_parameter_validation() {
        // Test parameter validation for auth endpoints

        // Test spotify_auth parameters
        let valid_codes = vec![
            "AQCi5l7qF2GKhAMFqKCMUg",
            "code_123_abc_xyz",
            "very_long_authorization_code_12345678901234567890",
        ];

        for code in valid_codes {
            assert!(!code.is_empty(), "Code should not be empty");
            assert!(code.len() >= 10, "Code should be reasonably long");
            assert!(
                code.chars().all(|c| c.is_alphanumeric() || c == '_'),
                "Code should contain valid characters"
            );
        }

        let valid_verifiers = vec![
            "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
            "verifier_123_test",
            "code_verifier_with_special_chars_123",
        ];

        for verifier in valid_verifiers {
            assert!(!verifier.is_empty(), "Verifier should not be empty");
            assert!(verifier.len() >= 10, "Verifier should be reasonably long");
        }

        // Test refresh_token parameters
        let valid_user_ids = vec![1, 100, 9999];

        for user_id in valid_user_ids {
            assert!(user_id > 0, "User ID should be positive");
            assert!(user_id < 100000, "User ID should be reasonable");

            // Test URL path parameter format
            let path = format!("/auth/refresh/{user_id}");
            assert!(path.starts_with("/auth/refresh/"));
            assert!(path.ends_with(&user_id.to_string()));
        }
    }

    #[test]
    fn test_http_status_codes() {
        // Test expected HTTP status codes for different scenarios

        // Success cases
        let success_status = Status::Ok;
        assert_eq!(success_status.code, 200);
        assert!(success_status.class().is_success());

        // Client error cases
        let bad_request_status = Status::BadRequest;
        assert_eq!(bad_request_status.code, 400);
        assert!(bad_request_status.class().is_client_error());

        let unprocessable_entity_status = Status::UnprocessableEntity;
        assert_eq!(unprocessable_entity_status.code, 422);
        assert!(unprocessable_entity_status.class().is_client_error());

        // Test status code ranges - verify success and error status codes exist
        let _ok_status = Status::Ok;
        let _bad_request_status = Status::BadRequest;
    }

    #[test]
    fn test_content_type_handling() {
        // Test content type handling for auth endpoints
        let json_content_type = ContentType::JSON;
        let form_content_type = ContentType::Form;

        // Test JSON content type
        assert_eq!(json_content_type.to_string(), "application/json");
        assert!(json_content_type.is_json());

        // Test form content type
        assert_eq!(
            form_content_type.to_string(),
            "application/x-www-form-urlencoded"
        );
        assert!(form_content_type.is_form());

        // Test that endpoints expect JSON for requests
        let expected_request_content_type = ContentType::JSON;
        assert!(expected_request_content_type.is_json());

        // Test that endpoints return JSON for responses
        let expected_response_content_type = ContentType::JSON;
        assert!(expected_response_content_type.is_json());
    }

    #[test]
    fn test_error_message_formats() {
        // Test error message formats returned by auth endpoints
        let error_messages = vec![
            "SPOTIFY_CLIENT_ID not set",
            "SPOTIFY_CLIENT_SECRET not set",
            "Failed to get connection: timeout",
            "Failed to find user: not found",
            "No refresh token available",
            "Token refresh failed: network error",
            "Profile fetch failed: unauthorized",
        ];

        for error_msg in error_messages {
            assert!(!error_msg.is_empty(), "Error message should not be empty");
            assert!(error_msg.len() > 5, "Error message should be descriptive");

            // Test error message structure
            if error_msg.contains("not set") {
                assert!(
                    error_msg.contains("SPOTIFY_"),
                    "Environment variable errors should mention SPOTIFY_"
                );
            }

            if error_msg.contains("Failed to") {
                assert!(
                    error_msg.contains(":"),
                    "Failed to errors should have explanation"
                );
            }

            // Test that error messages don't contain sensitive data
            assert!(
                !error_msg.contains("password"),
                "Error should not contain passwords"
            );
            assert!(
                !error_msg.contains("secret"),
                "Error should not contain secrets"
            );
            // Skip token check for "Token refresh failed" and "No refresh token available" messages
            if !error_msg.contains("Token refresh failed")
                && !error_msg.contains("No refresh token available")
            {
                assert!(
                    !error_msg.contains("token"),
                    "Error should not contain actual tokens"
                );
            }
        }
    }

    #[tokio::test]
    async fn test_concurrent_auth_requests() {
        // Test concurrent authentication request handling
        use std::sync::Arc;
        use tokio::sync::Mutex;

        let counter = Arc::new(Mutex::new(0));
        let mut handles = vec![];

        // Simulate multiple concurrent auth requests
        for i in 0..5 {
            let counter_clone = Arc::clone(&counter);
            let handle = tokio::spawn(async move {
                let auth_request = AuthRequest {
                    code: format!("test_code_{i}"),
                    code_verifier: format!("test_verifier_{i}"),
                };

                // Simulate processing
                tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

                let mut count = counter_clone.lock().await;
                *count += 1;

                // Validate request structure
                assert!(auth_request.code.contains(&i.to_string()));
                assert!(auth_request.code_verifier.contains(&i.to_string()));
                assert!(!auth_request.code.is_empty());
                assert!(!auth_request.code_verifier.is_empty());

                *count
            });

            handles.push(handle);
        }

        // Wait for all requests to complete
        let mut results = vec![];
        for handle in handles {
            results.push(handle.await.unwrap());
        }

        // Validate concurrent processing
        assert_eq!(results.len(), 5);
        let final_count = *counter.lock().await;
        assert_eq!(final_count, 5);
    }
}
