import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const TrackCard: React.FC<TrackCardProps> = ({ track, onPlay, isPlaying }) => (
  <View style={styles.card}>
    <Image source={{ uri: track.album.cover_medium }} style={styles.albumCover} />
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>
        {track.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {track.artist.name}
      </Text>
    </View>
    <TouchableOpacity onPress={onPlay} style={styles.playButton}>
      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={24}
        color={isPlaying ? '#1DB954' : '#fff'}
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#282828',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  albumCover: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  artist: {
    fontSize: 14,
    color: '#b3b3b3',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#1DB954',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TrackCard;