import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView, TextInput } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface Artist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  nb_album: number;
  nb_fan: number;
  radio: boolean;
  tracklist: string;
  type: string;
}

interface Album {
  id: number;
  title: string;
  link: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  tracklist: string;
  type: string;
}

interface Track {
  id: number;
  title: string;
  artist: Artist;
  album: Album;
  preview: string; // URL for 30-second preview
  duration: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Clean up sound object when component unmounts
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const searchArtist = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter an artist name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Using search endpoint with query parameter
      const response = await fetch(
        `https://deezerdevs-deezer.p.rapidapi.com/search?q=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': 'd950cce957mshb42913347a7457cp1dfe38jsn9c2fc9f52bd0',
            'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com',
          },
        }
      );

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.data && data.data.length > 0) {
        // Get tracks which contain both artist and album data
        setTracks(data.data);
      } else {
        setError('No results found');
        setTracks([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const playSound = async (previewUrl: string, trackId: number) => {
    try {
      // If a song is already playing, stop it first
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        
        // If clicking on the same track that's playing, just stop it
        if (currentlyPlayingId === trackId && isPlaying) {
          setCurrentlyPlayingId(null);
          setIsPlaying(false);
          return;
        }
      }
      
      // Load and play the new track
      console.log('Loading Sound');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setCurrentlyPlayingId(trackId);
      setIsPlaying(true);
      
      // When audio finishes playing
      newSound.setOnPlaybackStatusUpdate((status : any) => {
        if (status.isLoaded && status.didJustFinish) {
          setCurrentlyPlayingId(null);
          setIsPlaying(false);
        }
      });
      
    } catch (error) {
      console.error('Error playing sound:', error);
      setError('Failed to play track');
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSound = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for an artist"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
        />
        <Button title="Search" onPress={searchArtist} />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.resultContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : tracks.length > 0 ? (
          <FlatList
            data={tracks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.resultCard}>
                <View style={styles.artistSection}>
                  <Image source={{ uri: item.artist.picture_medium }} style={styles.artistImage} />
                  <View style={styles.artistInfo}>
                    <Text style={styles.artistName}>{item.artist.name}</Text>
                    <Text style={styles.fanCount}>{item.artist.nb_fan} fans</Text>
                  </View>
                </View>
                
                <View style={styles.albumSection}>
                  <Image source={{ uri: item.album.cover_medium }} style={styles.albumCover} />
                  <View style={styles.albumInfo}>
                    <Text style={styles.albumTitle}>{item.album.title}</Text>
                    <Text style={styles.trackTitle}>Track: {item.title}</Text>
                    <Text style={styles.trackDuration}>Duration: {formatDuration(item.duration)}</Text>
                  </View>
                </View>
                
                <View style={styles.playerControls}>
                  {item.preview ? (
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => {
                        if (currentlyPlayingId === item.id) {
                          isPlaying ? pauseSound() : resumeSound();
                        } else {
                          playSound(item.preview, item.id);
                        }
                      }}
                    >
                      <Ionicons
                        name={
                          currentlyPlayingId === item.id && isPlaying
                            ? 'pause-circle'
                            : 'play-circle'
                        }
                        size={48}
                        color="#1DB954"
                      />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noPreviewText}>No preview available</Text>
                  )}
                </View>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noDataText}>Search for an artist to see results</Text>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
    paddingHorizontal: 8,
  },
  resultContainer: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  artistSection: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  artistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fanCount: {
    fontSize: 14,
    color: '#666',
  },
  albumSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  albumCover: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  albumInfo: {
    flex: 1,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trackTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  trackDuration: {
    fontSize: 13,
    color: '#888',
  },
  playerControls: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  playButton: {
    padding: 4,
  },
  noPreviewText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  }
});