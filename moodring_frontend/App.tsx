import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';

interface TestDataResponse {
  message: string;
  data: string[];
  timestamp: string;
}

export default function App() {
  const [responseData, setResponseData] = useState<TestDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/test-data');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TestDataResponse = await response.json();
      setResponseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Moodring Test App</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={fetchTestData}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Fetch Data from Backend'}
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {responseData && (
        <ScrollView style={styles.responseContainer}>
          <Text style={styles.responseTitle}>Response from Backend:</Text>
          <Text style={styles.responseText}>Message: {responseData.message}</Text>
          <Text style={styles.responseText}>Timestamp: {responseData.timestamp}</Text>
          
          <Text style={styles.dataTitle}>Songs:</Text>
          {responseData.data.map((song, index) => (
            <Text key={index} style={styles.songText}>{song}</Text>
          ))}
        </ScrollView>
      )}

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
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  responseContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    maxHeight: 400,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  responseText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  songText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
    paddingLeft: 10,
  },
});
