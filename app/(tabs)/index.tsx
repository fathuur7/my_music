import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchArtist } from '../../services/deezerService';
import { useClerk } from '@clerk/clerk-expo';

export default function HomeScreen() {
  const [recommendations, setRecommendations] = useState([]);
  const [popularPlaylists, setPopularPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useClerk();
  const userName = user?.firstName || 'User'; // Fallback to 'User' if firstName is not available

  // List of search terms to get random recommendations
  const searchTerms = [
    'pop', 'rock', 'hip hop', 'jazz', 'electronic', 
    'classical', 'r&b', 'indie', 'dance', 'chill'
  ];

  const currentHour = new Date().getHours();
  let greeting;
  if (currentHour < 6) {
    greeting = 'Good morning, early riser! ' + userName;
  } else if (currentHour < 12) {
    greeting = 'Good morning! ' + userName;
  } else if (currentHour < 17) {
    greeting = 'Good afternoon! ' + userName;
  } else if (currentHour < 20) {
    greeting = 'Good evening! ' + userName;
  } else {
    greeting = 'Good night! ' + userName;
  }

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Get a random search term
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const data = await searchArtist(randomTerm);

        
        if (data && data.length > 0) {
          // Format data for recommendations
          const formattedRecommendations = data.slice(0, 4).map((item : any) => ({
            id: item.id,
            title: item.title || item.album?.title || 'Recommended Track',
            image: item.album?.cover_medium || 'https://via.placeholder.com/150',
            description: `By ${item.artist?.name || 'Unknown Artist'}`,
          }));
          
          setRecommendations(formattedRecommendations);
          
          // Use different items for popular playlists
          const formattedPlaylists = data.slice(4, 10).map((item : any) => ({
            id: item.id,
            title: item.title || item.album?.title || 'Popular Track',
            image: item.album?.cover_medium || 'https://via.placeholder.com/150',
            type: item.artist?.name || 'Artist',
          }));
          
          setPopularPlaylists(formattedPlaylists);
        }
      } catch (err : any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const renderItem = (item : any) => (
    <TouchableOpacity key={item.id} style={styles.item}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.itemSubtitle} numberOfLines={1}>{item.type}</Text>
    </TouchableOpacity>
  );

  const renderRecommendation = (item : any) => (
    <TouchableOpacity key={item.id} style={styles.recommendationItem}>
      <Image source={{ uri: item.image }} style={styles.recommendationImage} />
      <View style={styles.recommendationText}>
        <Text style={styles.recommendationTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.recommendationDescription} numberOfLines={2}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  // Loading indicator while fetching data
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Loading your music...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="time-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Image 
                source={{ uri: user?.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error message if something went wrong */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Made for you section */}
        <Text style={styles.sectionTitle}>Made for you</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {recommendations.map(renderRecommendation)}
        </ScrollView>

        {/* Popular playlists section */}
        <Text style={styles.sectionTitle}>Popular playlists</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {popularPlaylists.map(renderItem)}
        </ScrollView>
      </ScrollView>

      {/* Bottom player (mock) */}
      <View style={styles.player}>
        <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.playerImage} />
        <View style={styles.playerInfo}>
          <Text style={styles.playerTitle}>Currently Playing Song</Text>
          <Text style={styles.playerArtist}>Artist Name</Text>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ff494959',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingTop: 50, // Accounts for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingLeft: 16,
  },
  item: {
    width: 140,
    marginRight: 16,
    marginBottom: 16,
  },
  itemImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    color: '#aaa',
    fontSize: 12,
  },
  recommendationItem: {
    width: 280,
    flexDirection: 'row',
    marginRight: 16,
    backgroundColor: '#282828',
    borderRadius: 8,
    overflow: 'hidden',
  },
  recommendationImage: {
    width: 80,
    height: 80,
  },
  recommendationText: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  recommendationTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendationDescription: {
    color: '#aaa',
    fontSize: 12,
  },
  player: {
    height: 60,
    backgroundColor: '#282828',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  playerImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerArtist: {
    color: '#aaa',
    fontSize: 12,
  },
  playButton: {
    backgroundColor: '#1DB954',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});