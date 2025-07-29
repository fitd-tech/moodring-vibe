import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';

// TODO: TEMP - Remove these interfaces when moving to real features
interface TempSong {
  id: number;
  title: string;
  artist: string;
  genre?: string;
  created_at: string;
  updated_at: string;
}

interface NewTempSong {
  title: string;
  artist: string;
  genre?: string;
}

export default function App() {
  const [songs, setSongs] = useState<TempSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSong, setNewSong] = useState<NewTempSong>({ title: '', artist: '', genre: '' });
  const [editingSong, setEditingSong] = useState<TempSong | null>(null);

  // TODO: TEMP - Remove these functions when moving to real features
  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/songs');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TempSong[] = await response.json();
      setSongs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createSong = async () => {
    if (!newSong.title || !newSong.artist) {
      Alert.alert('Error', 'Please fill in title and artist');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSong),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setNewSong({ title: '', artist: '', genre: '' });
      await fetchSongs(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateSong = async (song: TempSong) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/songs/${song.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: song.title,
          artist: song.artist,
          genre: song.genre,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setEditingSong(null);
      await fetchSongs(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteSong = async (songId: number) => {
    Alert.alert(
      'Delete Song',
      'Are you sure you want to delete this song?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`http://localhost:8000/songs/${songId}`, {
                method: 'DELETE',
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              await fetchSongs(); // Refresh the list
            } catch (err) {
              setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Database Test App</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* Add New Song Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add New Song</Text>
        <TextInput
          style={styles.input}
          placeholder="Song Title"
          value={newSong.title}
          onChangeText={(text) => setNewSong({...newSong, title: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Artist"
          value={newSong.artist}
          onChangeText={(text) => setNewSong({...newSong, artist: text})}
        />
        <TextInput
          style={styles.input}
          placeholder="Genre (optional)"
          value={newSong.genre}
          onChangeText={(text) => setNewSong({...newSong, genre: text})}
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={createSong}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Adding...' : 'Add Song'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Songs List */}
      <ScrollView style={styles.songsContainer}>
        <View style={styles.songsHeader}>
          <Text style={styles.songsTitle}>Songs from Database ({songs.length})</Text>
          <TouchableOpacity onPress={fetchSongs} disabled={loading}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        
        {songs.map((song) => (
          <View key={song.id} style={styles.songItem}>
            {editingSong?.id === song.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editingSong.title}
                  onChangeText={(text) => setEditingSong({...editingSong, title: text})}
                />
                <TextInput
                  style={styles.editInput}
                  value={editingSong.artist}
                  onChangeText={(text) => setEditingSong({...editingSong, artist: text})}
                />
                <TextInput
                  style={styles.editInput}
                  value={editingSong.genre || ''}
                  onChangeText={(text) => setEditingSong({...editingSong, genre: text})}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => updateSong(editingSong)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setEditingSong(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.songContent}>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songArtist}>by {song.artist}</Text>
                {song.genre && <Text style={styles.songGenre}>Genre: {song.genre}</Text>}
                <Text style={styles.songTimestamp}>
                  Updated: {new Date(song.updated_at).toLocaleString()}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => setEditingSong(song)}
                  >
                    <Text style={styles.editButtonText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteSong(song.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
        
        {songs.length === 0 && !loading && (
          <Text style={styles.emptyText}>No songs in database. Add some!</Text>
        )}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songsContainer: {
    flex: 1,
  },
  songsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  songsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshText: {
    color: '#6366f1',
    fontSize: 16,
  },
  songItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  songContent: {
    position: 'relative',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  songArtist: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  songGenre: {
    fontSize: 12,
    color: '#888',
    marginBottom: 3,
  },
  songTimestamp: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 10,
  },
  actionButtons: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    gap: 5,
  },
  editButton: {
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  editButtonText: {
    color: '#6366f1',
    fontSize: 12,
  },
  deleteButton: {
    padding: 5,
    backgroundColor: '#fee2e2',
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 12,
  },
  editContainer: {
    gap: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    fontSize: 14,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
});
