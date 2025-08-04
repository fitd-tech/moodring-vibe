import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import * as Linking from 'expo-linking';

interface SpotifyShareData {
  url: string;
  type: 'track' | 'album' | 'playlist' | 'artist' | 'unknown';
  id?: string;
  title?: string;
  artist?: string;
  timestamp: string;
}

export default function App() {
  const [sharedData, setSharedData] = useState<SpotifyShareData[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseSpotifyUrl = (url: string): SpotifyShareData => {
    const timestamp = new Date().toISOString();
    
    try {
      // Parse Spotify URLs like: https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
      const spotifyRegex = /spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/;
      const match = url.match(spotifyRegex);
      
      if (match) {
        const [, type, id] = match;
        return {
          url,
          type: type as SpotifyShareData['type'],
          id,
          timestamp,
        };
      }
      
      // Also handle spotify: protocol URLs like: spotify:track:4iV5W9uYEdYUVa79Axb7Rh
      const protocolRegex = /spotify:(track|album|playlist|artist):([a-zA-Z0-9]+)/;
      const protocolMatch = url.match(protocolRegex);
      
      if (protocolMatch) {
        const [, type, id] = protocolMatch;
        return {
          url,
          type: type as SpotifyShareData['type'],
          id,
          timestamp,
        };
      }
      
      return {
        url,
        type: 'unknown',
        timestamp,
      };
    } catch (err) {
      return {
        url,
        type: 'unknown',
        timestamp,
      };
    }
  };

  const handleIncomingUrl = (url: string) => {
    setCurrentUrl(url);
    setError(null);
    
    // Check if it's a Spotify URL
    if (url.includes('spotify')) {
      const parsedData = parseSpotifyUrl(url);
      setSharedData(prev => [parsedData, ...prev]);
    } else {
      // Handle other URLs or show as received
      const genericData: SpotifyShareData = {
        url,
        type: 'unknown',
        timestamp: new Date().toISOString(),
      };
      setSharedData(prev => [genericData, ...prev]);
    }
  };

  const clearHistory = () => {
    setSharedData([]);
    setCurrentUrl(null);
    setError(null);
  };

  useEffect(() => {
    // Check for initial URL when app launches
    const checkInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        if (initialURL) {
          handleIncomingUrl(initialURL);
        }
      } catch (err) {
        setError('Failed to get initial URL');
      }
    };

    checkInitialURL();

    // Listen for URL changes while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleIncomingUrl(event.url);
    });

    return () => subscription?.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Moodring - Spotify Share Test</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📱 Test Spotify Sharing</Text>
        <Text style={styles.instructionsText}>
          1. Open Spotify app{'\n'}
          2. Find a song, album, or playlist{'\n'}
          3. Tap Share → Copy Link or Share to Moodring{'\n'}
          4. Return to this app to see the shared data
        </Text>
      </View>

      {/* Current URL Display */}
      {currentUrl && (
        <View style={styles.currentUrlContainer}>
          <Text style={styles.currentUrlTitle}>🔗 Last Received URL:</Text>
          <Text style={styles.currentUrlText} numberOfLines={2}>
            {currentUrl}
          </Text>
        </View>
      )}

      {/* Shared Data History */}
      <ScrollView style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>📝 Received Shares ({sharedData.length})</Text>
          {sharedData.length > 0 && (
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>🗑️ Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {sharedData.map((item, index) => (
          <View key={`${item.timestamp}-${index}`} style={styles.shareItem}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareType}>
                {item.type === 'track' && '🎵 Track'}
                {item.type === 'album' && '💿 Album'}
                {item.type === 'playlist' && '📚 Playlist'}
                {item.type === 'artist' && '🎤 Artist'}
                {item.type === 'unknown' && '❓ Unknown'}
              </Text>
              <Text style={styles.shareTime}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
            
            {item.id && (
              <Text style={styles.shareId}>ID: {item.id}</Text>
            )}
            
            <Text style={styles.shareUrl} numberOfLines={3}>
              {item.url}
            </Text>
            
            {item.title && (
              <Text style={styles.shareTitle}>Title: {item.title}</Text>
            )}
            
            {item.artist && (
              <Text style={styles.shareArtist}>Artist: {item.artist}</Text>
            )}
          </View>
        ))}
        
        {sharedData.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No shared content received yet.{'\n'}
              Try sharing a Spotify link to this app!
            </Text>
          </View>
        )}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1db954',
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
  instructionsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1db954',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1db954',
  },
  instructionsText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  currentUrlContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#666',
  },
  currentUrlTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1db954',
  },
  currentUrlText: {
    fontSize: 12,
    color: '#cccccc',
    fontFamily: 'monospace',
  },
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
  shareItem: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1db954',
  },
  shareTime: {
    fontSize: 12,
    color: '#888',
  },
  shareId: {
    fontSize: 12,
    color: '#ffd700',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  shareUrl: {
    fontSize: 11,
    color: '#cccccc',
    backgroundColor: '#0a0a0a',
    padding: 8,
    borderRadius: 5,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  shareTitle: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 3,
    fontWeight: 'bold',
  },
  shareArtist: {
    fontSize: 13,
    color: '#cccccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
  },
});
