import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface LibraryItem {
  _id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  audioUrl: string;
  originalUrl: string;
  durationInSeconds: number;
  createdAt: string;
  __v: number;
}

interface ApiResponse {
  success: boolean;
  audios: LibraryItem[];
}

export default function LibraryScreen() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  // Fetch library items from your API
  useEffect(() => {
    fetchLibrary();
  }, []);

  // Clean up sound object on unmount
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [currentSound]);

  const fetchLibrary = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('http://192.168.1.42:5000/api/audio/audios');
      const data: ApiResponse = await response.json();
      setLibrary(data.audios); // Access the audios array from the response
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch library:", error);
      setLoading(false);
    }
  };

  const playAudio = async (id: string) => {
    try {
      // Stop current track if there is one
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      }

      // In a real implementation, you would fetch from your API
      const audioUrl = `http://192.168.1.42:5000/api/audio/download/${id}`;
      
      // Create and play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setCurrentSound(sound);
      setIsPlaying(true);
      setCurrentTrackId(id);
      
      // Add status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentTrackId(null);
        }
      });      
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  };
  
  const pauseAudio = async () => {
    if (currentSound) {
      await currentSound.pauseAsync();
      setIsPlaying(false);
    }
  };
  
  const resumeAudio = async () => {
    if (currentSound) {
      await currentSound.playAsync();
      setIsPlaying(true);
    }
  };

  const renderItem = ({ item }: { item: LibraryItem }) => {
    const isActive = currentTrackId === item._id;
    
    return (
      <TouchableOpacity 
        style={[styles.item, isActive && styles.activeItem]} 
        onPress={() => {
          if (isActive && isPlaying) {
            pauseAudio();
          } else if (isActive && !isPlaying) {
            resumeAudio();
          } else {
            playAudio(item._id);
          }
        }}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.artist} • {item.duration}</Text>
        </View>
        <View style={styles.playButton}>
          {isActive && isPlaying ? (
            <Ionicons name="pause" size={24} color="#1DB954" />
          ) : (
            <Ionicons name="play" size={24} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Library</Text>
      
      <FlatList
        data={library}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      
      {currentTrackId && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingText}>
            Now playing: {library.find((item: LibraryItem) => item._id === currentTrackId)?.title}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 80,
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  activeItem: {
    backgroundColor: '#282828',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    color: '#B3B3B3',
    fontSize: 14,
    marginTop: 4,
  },
  playButton: {
    padding: 10,
  },
  nowPlaying: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#282828',
    padding: 16,
    alignItems: 'center',
  },
  nowPlayingText: {
    color: '#FFFFFF',
    fontSize: 14,
  }
});