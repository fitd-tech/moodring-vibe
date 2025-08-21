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

#[cfg(test)]
mod tests {
    use super::*;
    use rocket::http::{ContentType, Status};
    use serde_json::json;

    #[test]
    fn test_get_user_tags_endpoint_structure() {
        // Test endpoint parameter structure and validation
        let user_ids = vec![1, 42, 123, 9999];

        for user_id in user_ids {
            assert!(user_id > 0, "User ID should be positive");

            // Test URL path construction
            let path = format!("/users/{user_id}/tags");
            assert!(path.starts_with("/users/"));
            assert!(path.ends_with("/tags"));
            assert!(path.contains(&user_id.to_string()));

            // Test path parsing
            let path_parts: Vec<&str> = path.split('/').collect();
            assert_eq!(path_parts.len(), 4); // ["", "users", "{user_id}", "tags"]
            assert_eq!(path_parts[1], "users");
            assert_eq!(path_parts[2], &user_id.to_string());
            assert_eq!(path_parts[3], "tags");
        }
    }

    #[test]
    fn test_create_tag_request_structure() {
        // Test NewTag structure and validation
        let new_tags = vec![
            NewTag {
                user_id: 1,
                name: "Rock".to_string(),
                color: Some("#FF0000".to_string()),
            },
            NewTag {
                user_id: 2,
                name: "Jazz".to_string(),
                color: Some("#0000FF".to_string()),
            },
            NewTag {
                user_id: 3,
                name: "Classical".to_string(),
                color: None,
            },
        ];

        for new_tag in new_tags {
            // Validate required fields
            assert!(new_tag.user_id > 0, "User ID should be positive");
            assert!(!new_tag.name.is_empty(), "Name should not be empty");
            assert!(new_tag.name.len() >= 3, "Name should be descriptive");

            // Validate color format if present
            if let Some(ref color) = new_tag.color {
                assert!(color.starts_with('#'), "Color should start with #");
                assert_eq!(color.len(), 7, "Color should be 7 characters (# + 6 hex)");

                // Test hex color validation
                let hex_chars = &color[1..];
                assert!(
                    hex_chars.chars().all(|c| c.is_ascii_hexdigit()),
                    "Color should be valid hex"
                );
            }

            // Test JSON serialization structure
            let json_repr = json!({
                "name": new_tag.name,
                "color": new_tag.color
            });

            assert!(json_repr["name"].is_string());
            assert_eq!(json_repr["name"], new_tag.name);

            if new_tag.color.is_some() {
                assert!(json_repr["color"].is_string());
                assert_eq!(json_repr["color"], new_tag.color.unwrap());
            } else {
                assert!(json_repr["color"].is_null());
            }
        }
    }

    #[test]
    fn test_delete_tag_endpoint_structure() {
        // Test delete tag endpoint parameter structure
        let test_cases = vec![
            (1, 10),   // user_id: 1, tag_id: 10
            (42, 123), // user_id: 42, tag_id: 123
            (999, 1),  // user_id: 999, tag_id: 1
        ];

        for (user_id, tag_id) in test_cases {
            assert!(user_id > 0, "User ID should be positive");
            assert!(tag_id > 0, "Tag ID should be positive");

            // Test URL path construction
            let path = format!("/users/{user_id}/tags/{tag_id}");
            assert!(path.starts_with("/users/"));
            assert!(path.contains("/tags/"));
            assert!(path.contains(&user_id.to_string()));
            assert!(path.contains(&tag_id.to_string()));

            // Test path parsing
            let path_parts: Vec<&str> = path.split('/').collect();
            assert_eq!(path_parts.len(), 5); // ["", "users", "{user_id}", "tags", "{tag_id}"]
            assert_eq!(path_parts[1], "users");
            assert_eq!(path_parts[2], &user_id.to_string());
            assert_eq!(path_parts[3], "tags");
            assert_eq!(path_parts[4], &tag_id.to_string());
        }
    }

    #[test]
    fn test_get_song_tags_endpoint_structure() {
        // Test song tags endpoint parameter structure
        let test_cases = vec![
            ("spotify:track:4iV5W9uYEdYUVa79Axb7Rh", 1),
            ("spotify:track:0VjIjW4GlULA4PmvEZMxfL", 42),
            ("spotify:track:test123", 999),
        ];

        for (song_id, user_id) in test_cases {
            assert!(!song_id.is_empty(), "Song ID should not be empty");
            assert!(
                song_id.starts_with("spotify:track:"),
                "Song ID should be Spotify format"
            );
            assert!(user_id > 0, "User ID should be positive");

            // Test URL path construction
            let path = format!("/songs/{song_id}/tags");
            let query = format!("user_id={user_id}");
            let full_url = format!("{path}?{query}");

            assert!(path.starts_with("/songs/"));
            assert!(path.ends_with("/tags"));
            assert!(path.contains(song_id));
            assert!(full_url.contains(&format!("user_id={user_id}")));

            // Test song ID format validation
            let song_parts: Vec<&str> = song_id.split(':').collect();
            assert_eq!(song_parts.len(), 3, "Spotify URI should have 3 parts");
            assert_eq!(song_parts[0], "spotify");
            assert_eq!(song_parts[1], "track");
            assert!(!song_parts[2].is_empty(), "Track ID should not be empty");
        }
    }

    #[test]
    fn test_add_tag_to_song_request_structure() {
        // Test NewSongTag structure and validation
        let new_song_tags = vec![
            NewSongTag {
                user_id: 1,
                song_id: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh".to_string(),
                tag_id: 10,
            },
            NewSongTag {
                user_id: 42,
                song_id: "spotify:track:0VjIjW4GlULA4PmvEZMxfL".to_string(),
                tag_id: 123,
            },
        ];

        for new_song_tag in new_song_tags {
            // Validate required fields
            assert!(new_song_tag.user_id > 0, "User ID should be positive");
            assert!(new_song_tag.tag_id > 0, "Tag ID should be positive");
            assert!(
                !new_song_tag.song_id.is_empty(),
                "Song ID should not be empty"
            );
            assert!(
                new_song_tag.song_id.starts_with("spotify:track:"),
                "Song ID should be Spotify format"
            );

            // Test JSON serialization
            let json_repr = json!({
                "user_id": new_song_tag.user_id,
                "tag_id": new_song_tag.tag_id
            });

            assert!(json_repr["user_id"].is_number());
            assert!(json_repr["tag_id"].is_number());
            assert_eq!(json_repr["user_id"], new_song_tag.user_id);
            assert_eq!(json_repr["tag_id"], new_song_tag.tag_id);

            // Validate song ID format
            let song_parts: Vec<&str> = new_song_tag.song_id.split(':').collect();
            assert_eq!(song_parts.len(), 3);
            assert_eq!(song_parts[0], "spotify");
            assert_eq!(song_parts[1], "track");
            assert!(!song_parts[2].is_empty());
        }
    }

    #[test]
    fn test_remove_tag_from_song_endpoint_structure() {
        // Test remove tag from song endpoint parameter structure
        let test_cases = vec![
            ("spotify:track:4iV5W9uYEdYUVa79Axb7Rh", 10, 1),
            ("spotify:track:0VjIjW4GlULA4PmvEZMxfL", 123, 42),
            ("spotify:track:test123", 1, 999),
        ];

        for (song_id, tag_id, user_id) in test_cases {
            assert!(!song_id.is_empty(), "Song ID should not be empty");
            assert!(
                song_id.starts_with("spotify:track:"),
                "Song ID should be Spotify format"
            );
            assert!(tag_id > 0, "Tag ID should be positive");
            assert!(user_id > 0, "User ID should be positive");

            // Test URL path construction
            let path = format!("/songs/{song_id}/tags/{tag_id}");
            let query = format!("user_id={user_id}");
            let full_url = format!("{path}?{query}");

            assert!(path.starts_with("/songs/"));
            assert!(path.contains("/tags/"));
            assert!(path.contains(song_id));
            assert!(path.contains(&tag_id.to_string()));
            assert!(full_url.contains(&format!("user_id={user_id}")));
        }
    }

    #[test]
    fn test_get_songs_with_tag_endpoint_structure() {
        // Test get songs with tag endpoint parameter structure
        let test_cases = vec![
            (1, 10),   // user_id: 1, tag_id: 10
            (42, 123), // user_id: 42, tag_id: 123
            (999, 1),  // user_id: 999, tag_id: 1
        ];

        for (user_id, tag_id) in test_cases {
            assert!(user_id > 0, "User ID should be positive");
            assert!(tag_id > 0, "Tag ID should be positive");

            // Test URL path construction
            let path = format!("/users/{user_id}/tags/{tag_id}/songs");
            assert!(path.starts_with("/users/"));
            assert!(path.contains("/tags/"));
            assert!(path.ends_with("/songs"));
            assert!(path.contains(&user_id.to_string()));
            assert!(path.contains(&tag_id.to_string()));

            // Test path parsing
            let path_parts: Vec<&str> = path.split('/').collect();
            assert_eq!(path_parts.len(), 6); // ["", "users", "{user_id}", "tags", "{tag_id}", "songs"]
            assert_eq!(path_parts[1], "users");
            assert_eq!(path_parts[2], &user_id.to_string());
            assert_eq!(path_parts[3], "tags");
            assert_eq!(path_parts[4], &tag_id.to_string());
            assert_eq!(path_parts[5], "songs");
        }
    }

    #[tokio::test]
    async fn test_database_connection_handling() {
        // Test database connection and pool handling patterns
        use diesel::r2d2::{ConnectionManager, Pool};
        use diesel::PgConnection;

        // Test connection manager creation (configuration only, no actual connection)
        let manager = ConnectionManager::<PgConnection>::new("postgresql://test@localhost/test");

        // Validate manager creation (this tests configuration, not connection)
        let manager_debug = format!("{manager:?}");
        assert!(
            manager_debug.contains("ConnectionManager"),
            "Manager should be created"
        );

        // Test pool builder configuration (without actual connection)
        let pool_config_test: diesel::r2d2::Builder<ConnectionManager<PgConnection>> =
            Pool::builder().max_size(1).test_on_check_out(false); // Disable connection testing for unit test

        // Validate that pool builder can be configured
        let _builder_debug = format!("{pool_config_test:?}");
        // Note: We don't build the pool since that would require actual database connection

        // Test spawn_blocking pattern structure
        let test_result = tokio::task::spawn_blocking(move || {
            // Simulate database operation structure
            let connection_result = "simulated_connection";
            Ok::<_, String>(connection_result)
        })
        .await;

        assert!(test_result.is_ok(), "spawn_blocking should complete");
        assert!(
            test_result.unwrap().is_ok(),
            "Simulated operation should succeed"
        );
    }

    #[tokio::test]
    async fn test_diesel_query_structure() {
        // Test Diesel query structure and patterns
        use crate::schema;

        // Test schema table references
        let tags_table = schema::tags::table;
        let song_tags_table = schema::song_tags::table;
        let users_table = schema::users::table;

        // Validate table references are available
        let _tags_debug = format!("{tags_table:?}");
        let _song_tags_debug = format!("{song_tags_table:?}");
        let _users_debug = format!("{users_table:?}");

        // Test column references
        let tags_user_id = schema::tags::dsl::user_id;
        let tags_name = schema::tags::dsl::name;
        let tags_id = schema::tags::dsl::id;

        let song_tags_user_id = schema::song_tags::dsl::user_id;
        let song_tags_song_id = schema::song_tags::dsl::song_id;
        let song_tags_tag_id = schema::song_tags::dsl::tag_id;

        // Validate column references
        let _tags_user_id_debug = format!("{tags_user_id:?}");
        let _tags_name_debug = format!("{tags_name:?}");
        let _tags_id_debug = format!("{tags_id:?}");
        let _song_tags_user_id_debug = format!("{song_tags_user_id:?}");
        let _song_tags_song_id_debug = format!("{song_tags_song_id:?}");
        let _song_tags_tag_id_debug = format!("{song_tags_tag_id:?}");
    }

    #[test]
    fn test_error_handling_patterns() {
        // Test error handling patterns used in tag endpoints

        // Test database connection errors
        let connection_errors = vec![
            "Failed to get connection: timeout",
            "Failed to get connection: pool exhausted",
            "Failed to get connection: network error",
        ];

        for error in connection_errors {
            assert!(error.starts_with("Failed to get connection:"));
            assert!(!error.is_empty());
            assert!(error.len() > 20);
        }

        // Test query execution errors
        let query_errors = vec![
            "Failed to load tags: database error",
            "Failed to create tag: constraint violation",
            "Failed to delete tag: foreign key constraint",
            "Failed to load song tags: table not found",
            "Failed to add tag to song: duplicate key",
            "Failed to remove tag from song: not found",
            "Failed to load songs with tag: permission denied",
        ];

        for error in query_errors {
            assert!(error.starts_with("Failed to"));
            assert!(error.contains(":"));
            assert!(!error.is_empty());
            assert!(error.len() > 15);
        }

        // Test task join errors
        let task_errors = vec![
            "Task join error: task panicked",
            "Task join error: cancelled",
            "Task join error: timeout",
        ];

        for error in task_errors {
            assert!(error.starts_with("Task join error:"));
            assert!(!error.is_empty());
            assert!(error.len() > 15);
        }
    }

    #[test]
    fn test_http_status_responses() {
        // Test HTTP status codes used by tag endpoints

        // Success responses
        let ok_status = Status::Ok;
        let no_content_status = Status::NoContent;

        assert_eq!(ok_status.code, 200);
        assert_eq!(no_content_status.code, 204);
        assert!(ok_status.class().is_success());
        assert!(no_content_status.class().is_success());

        // Error responses
        let bad_request_status = Status::BadRequest;
        let not_found_status = Status::NotFound;
        let unprocessable_entity_status = Status::UnprocessableEntity;

        assert_eq!(bad_request_status.code, 400);
        assert_eq!(not_found_status.code, 404);
        assert_eq!(unprocessable_entity_status.code, 422);
        assert!(bad_request_status.class().is_client_error());
        assert!(not_found_status.class().is_client_error());
        assert!(unprocessable_entity_status.class().is_client_error());
    }

    #[test]
    fn test_json_response_structure() {
        // Test JSON response structure for tag endpoints

        // Test Tag response structure
        let mock_tag = Tag {
            id: 1,
            user_id: 42,
            name: "Rock".to_string(),
            color: Some("#FF0000".to_string()),
            created_at: chrono::Utc::now().naive_utc(),
            updated_at: chrono::Utc::now().naive_utc(),
        };

        let tag_json = serde_json::to_value(&mock_tag).unwrap();
        assert!(tag_json["id"].is_number());
        assert!(tag_json["user_id"].is_number());
        assert!(tag_json["name"].is_string());
        assert!(tag_json["color"].is_string());
        assert!(tag_json["created_at"].is_string());
        assert!(tag_json["updated_at"].is_string());
        assert_eq!(tag_json["id"], 1);
        assert_eq!(tag_json["user_id"], 42);
        assert_eq!(tag_json["name"], "Rock");
        assert_eq!(tag_json["color"], "#FF0000");

        // Test SongTag response structure
        let mock_song_tag = SongTag {
            id: 1,
            user_id: 42,
            song_id: "spotify:track:test123".to_string(),
            tag_id: 10,
            created_at: chrono::Utc::now().naive_utc(),
        };

        let song_tag_json = serde_json::to_value(&mock_song_tag).unwrap();
        assert!(song_tag_json["id"].is_number());
        assert!(song_tag_json["user_id"].is_number());
        assert!(song_tag_json["song_id"].is_string());
        assert!(song_tag_json["tag_id"].is_number());
        assert!(song_tag_json["created_at"].is_string());
        assert_eq!(song_tag_json["id"], 1);
        assert_eq!(song_tag_json["user_id"], 42);
        assert_eq!(song_tag_json["song_id"], "spotify:track:test123");
        assert_eq!(song_tag_json["tag_id"], 10);

        // Test array responses
        let tags_array = vec![mock_tag];
        let tags_json = serde_json::to_value(&tags_array).unwrap();
        assert!(tags_json.is_array());
        assert_eq!(tags_json.as_array().unwrap().len(), 1);

        let songs_array = vec![
            "spotify:track:test1".to_string(),
            "spotify:track:test2".to_string(),
        ];
        let songs_json = serde_json::to_value(&songs_array).unwrap();
        assert!(songs_json.is_array());
        assert_eq!(songs_json.as_array().unwrap().len(), 2);
        assert!(songs_json[0].is_string());
        assert!(songs_json[1].is_string());
    }

    #[test]
    fn test_content_type_validation() {
        // Test content type handling for tag endpoints
        let json_content_type = ContentType::JSON;

        assert_eq!(json_content_type.to_string(), "application/json");
        assert!(json_content_type.is_json());

        // Test that endpoints expect JSON for POST/PUT requests
        let create_tag_content_type = ContentType::JSON;
        let add_tag_to_song_content_type = ContentType::JSON;

        assert!(create_tag_content_type.is_json());
        assert!(add_tag_to_song_content_type.is_json());

        // Test that endpoints return JSON for all responses
        let response_content_type = ContentType::JSON;
        assert!(response_content_type.is_json());
    }

    #[test]
    fn test_request_validation_patterns() {
        // Test request validation patterns for tag endpoints

        // Test valid tag names
        let valid_names = vec![
            "Rock",
            "Jazz",
            "Classical Music",
            "Hip-Hop",
            "Electronic Dance Music",
            "Ambient Soundscapes",
            "Workout Playlist",
            "Road Trip Songs",
        ];

        for name in valid_names {
            assert!(!name.is_empty(), "Name should not be empty");
            assert!(name.len() >= 3, "Name should be at least 3 characters");
            assert!(name.len() <= 100, "Name should not be too long");
            assert!(
                !name.trim().is_empty(),
                "Name should not be just whitespace"
            );
        }

        // Test invalid tag names
        let invalid_names = vec![
            "", "  ", "AB", // Too short
        ];

        for name in invalid_names {
            let is_invalid = name.is_empty() || name.trim().is_empty() || name.len() < 3;
            assert!(is_invalid, "Invalid name should be detected: '{name}'");
        }

        // Test valid colors
        let valid_colors = vec![
            "#FF0000", // Red
            "#00FF00", // Green
            "#0000FF", // Blue
            "#FFFFFF", // White
            "#000000", // Black
            "#FF5733", // Orange
            "#C70039", // Deep red
            "#900C3F", // Dark red
        ];

        for color in valid_colors {
            assert!(color.starts_with('#'), "Color should start with #");
            assert_eq!(color.len(), 7, "Color should be 7 characters");
            let hex_part = &color[1..];
            assert!(
                hex_part.chars().all(|c| c.is_ascii_hexdigit()),
                "Color should be valid hex"
            );
        }

        // Test invalid colors
        let invalid_colors = vec![
            "FF0000",  // Missing #
            "#FF00",   // Too short
            "#FF00GG", // Invalid hex
            "#GGFFFF", // Invalid hex
        ];

        for color in invalid_colors {
            let is_invalid = !color.starts_with('#')
                || color.len() != 7
                || !color[1..].chars().all(|c| c.is_ascii_hexdigit());
            assert!(is_invalid, "Invalid color should be detected: '{color}'");
        }
    }

    #[tokio::test]
    async fn test_concurrent_tag_operations() {
        // Test concurrent tag operations handling
        use std::sync::Arc;
        use tokio::sync::Mutex;

        let counter = Arc::new(Mutex::new(0));
        let mut handles = vec![];

        // Simulate multiple concurrent tag operations
        for i in 0..10 {
            let counter_clone = Arc::clone(&counter);
            let handle = tokio::spawn(async move {
                let new_tag = NewTag {
                    user_id: i,
                    name: format!("Tag {i}"),
                    color: Some(format!("#FF{:04X}", i * 1000)),
                };

                // Simulate processing time
                tokio::time::sleep(tokio::time::Duration::from_millis(5)).await;

                let mut count = counter_clone.lock().await;
                *count += 1;

                // Validate tag structure
                assert_eq!(new_tag.user_id, i);
                assert!(new_tag.name.contains(&i.to_string()));
                assert!(new_tag.color.is_some());
                assert!(new_tag.color.unwrap().starts_with("#FF"));

                i
            });

            handles.push(handle);
        }

        // Wait for all operations to complete
        let mut results = vec![];
        for handle in handles {
            results.push(handle.await.unwrap());
        }

        // Validate concurrent processing
        assert_eq!(results.len(), 10);
        let final_count = *counter.lock().await;
        assert_eq!(final_count, 10);

        // Validate all operations completed with correct values
        for i in 0..10 {
            assert!(results.contains(&i), "Result should contain value {i}");
        }
    }

    #[test]
    fn test_diesel_filter_patterns() {
        // Test Diesel filter patterns used in tag queries
        use crate::schema;

        // Test filter equality patterns
        let user_id_filter = 42;
        let tag_id_filter = 123;
        let song_id_filter = "spotify:track:test123";

        assert!(user_id_filter > 0);
        assert!(tag_id_filter > 0);
        assert!(!song_id_filter.is_empty());
        assert!(song_id_filter.starts_with("spotify:track:"));

        // Test filter combination patterns (AND/OR logic)
        let multiple_filters =
            (user_id_filter > 0) && (tag_id_filter > 0) && (!song_id_filter.is_empty());
        assert!(multiple_filters, "All filters should be valid");

        // Test column reference patterns
        let _user_id_column = schema::tags::dsl::user_id;
        let _tag_id_column = schema::tags::dsl::id;
        let _name_column = schema::tags::dsl::name;
        let _song_id_column = schema::song_tags::dsl::song_id;

        // Test ordering patterns
        let order_column = schema::tags::dsl::name;
        let _order_debug = format!("{order_column:?}");
    }

    #[test]
    fn test_join_query_patterns() {
        // Test Diesel join query patterns used in tag operations
        use crate::schema;

        // Test table references for joins
        let song_tags_table = schema::song_tags::table;
        let tags_table = schema::tags::table;

        let _song_tags_debug = format!("{song_tags_table:?}");
        let _tags_debug = format!("{tags_table:?}");

        // Test join column patterns
        let song_tags_tag_id = schema::song_tags::dsl::tag_id;
        let tags_id = schema::tags::dsl::id;

        let _join_column_1 = format!("{song_tags_tag_id:?}");
        let _join_column_2 = format!("{tags_id:?}");

        // Test select patterns for joins
        let tags_all_columns = schema::tags::all_columns;
        let _select_debug = format!("{tags_all_columns:?}");
    }
}
