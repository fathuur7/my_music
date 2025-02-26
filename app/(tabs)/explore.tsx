import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { searchArtist } from '../../services/deezerService';
import TrackCard from '../../components/TrackCard/TrackCard';
import useAudioPlayer from '../../hooks/useAudioPlayer';

interface TrackCardProps {
    track: {
      id: number;
      title: string;
      artist: { name: string; picture_medium: string };
      album: { cover_medium: string };
      preview: string;
      duration: number;
    };
    onPlay: () => void;
    isPlaying: boolean;
  }

export default function ExploreScreen() {
    const [query, setQuery] = useState('');
    const [tracks, setTracks] = useState<TrackCardProps['track'][]>([]);
    const [loading, setLoading] = useState(false);
    const { playSound, pauseSound, isPlaying, currentlyPlayingId } = useAudioPlayer();
  

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchArtist(query);
      setTracks(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search for an artist"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TrackCard
              track={item}
              onPlay={() => playSound(item.preview, item.id)}
              isPlaying={currentlyPlayingId === item.id && isPlaying}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#1DB954',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
});