import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  ToastAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { io } from 'socket.io-client';
import LoadingOverlay from '../../components/loading/loadingOverlay';
import { getSavedAudios } from '../../services/youtube-service';
import { useAudioPlayer } from '../../services/set';

// Library item interface
interface LibraryItem {
  _id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  addedAt: string;
}

// Interface for YouTube items (matching the one from ExploreScreen)
interface VideoResult {
  id: number;
  title: string;
  author: string;
  authorUrl: string;
  duration: string;
  durationInSeconds: number;
  thumbnail: string;
  uploadedAt: string;
  url: string;
  views: string;
}

// Track card component for library items
const TrackCard = ({ item, onPlay, isPlaying }: { item: LibraryItem | VideoResult, onPlay: (item: LibraryItem | VideoResult) => void, isPlaying: boolean }) => {
  const isVideoResult = (item: LibraryItem | VideoResult): item is VideoResult => {
    return 'author' in item;
  };

  return (
    <TouchableOpacity 
      style={styles.trackCard}
      onPress={() => onPlay(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.thumbnail }} 
        style={styles.trackThumbnail}
        resizeMode="cover"
      />
      
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.trackArtist}>{isVideoResult(item) ? item.author : item.artist}</Text>
        <Text style={styles.trackMeta}>{item.duration}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.playButton, isPlaying ? styles.pauseButton : null]}
        onPress={() => onPlay(item)}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={24} 
          color="#fff" 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
// Recent downloads section
const RecentSection = ({ title, data, onPlay, currentTrackId, isPlaying }: { 
  title: string;
  data: any[];
  onPlay: (item: any) => void;
  currentTrackId: string;
  isPlaying: boolean;
}) => {
  if (!data || data.length === 0) return null;
  
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={data.slice(0, 5)}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.recentItem}
            onPress={() => onPlay(item)}
          >
            <View style={styles.recentImageContainer}>
              <Image 
                source={{ uri: item.thumbnail }} 
                style={styles.recentImage} 
                resizeMode="cover"
              />
              <View style={[
                styles.playOverlay, 
                currentTrackId === item._id && isPlaying ? styles.activeOverlay : null
              ]}>
                <Ionicons 
                  name={currentTrackId === item._id && isPlaying ? "pause" : "play"} 
                  size={28} 
                  color="#fff" 
                />
              </View>
            </View>
            <Text style={styles.recentTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.recentArtist} numberOfLines={1}>{item.artist}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.recentsList}
      />
    </View>
  );
};

export default function YourMusicScreen() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [recentTracks, setRecentTracks] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [newDataNotification, setNewDataNotification] = useState<string | null>(null);
  
  const { 
    isPlaying, 
    currentTrackId,
    isConverting,
    convertingTitle,
    isDownloading,
    playAudio, 
    toggleAudio,
    handleVideoPlay 
  } = useAudioPlayer();
  
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const dimensions = useWindowDimensions();
  const isTablet = dimensions.width >= 768;
  const socketRef = useRef<any>(null);
  
  // Animation values for header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [isTablet ? 110 : 120, 70],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });
  
  // WebSocket connection setup
  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('YOUR_SOCKET_SERVER_URL', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Socket connection event handlers
    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
      setSocketConnected(true);
      triggerHaptic('light');
      
      // Subscribe to library updates channel
      socketRef.current.emit('subscribe', 'libraryUpdates');
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setSocketConnected(false);
    });
    
    socketRef.current.on('reconnect', (attempt: number) => {
      console.log(`Reconnected to WebSocket server after ${attempt} attempts`);
      setSocketConnected(true);
    });
    
    socketRef.current.on('error', (error: any) => {
      console.error('Socket connection error:', error);
    });
    
    // Listen for new audio events
    socketRef.current.on('newAudio', (newAudio: LibraryItem) => {
      console.log('New audio received:', newAudio);
      
      // Update library with new data
      setLibrary(prevLibrary => {
        // Check if item already exists
        if (prevLibrary.some(item => item._id === newAudio._id)) {
          return prevLibrary;
        }
        return [...prevLibrary, newAudio];
      });
      
      // Update recent tracks
      setRecentTracks(prevTracks => {
        // Check if item already exists
        if (prevTracks.some(item => item._id === newAudio._id)) {
          return prevTracks;
        }
        
        // Add new track and sort
        const updatedTracks = [newAudio, ...prevTracks];
        return updatedTracks.sort((a, b) => 
          new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
      });
      
      // Show notification
      showNotification(`New track added: ${newAudio.title}`);
      triggerHaptic('success');
    });
    
    // Listen for deleted audio events
    socketRef.current.on('deletedAudio', (audioId: string) => {
      console.log('Audio deleted:', audioId);
      
      // Remove from library
      setLibrary(prevLibrary => 
        prevLibrary.filter(item => item._id !== audioId)
      );
      
      // Remove from recent tracks
      setRecentTracks(prevTracks => 
        prevTracks.filter(item => item._id !== audioId)
      );
      
      // Show notification
      showNotification('Track was removed from your library');
      triggerHaptic('light');
    });
    
    // Listen for library update events (batch updates)
    socketRef.current.on('libraryUpdate', (updatedLibrary: LibraryItem[]) => {
      console.log('Full library update received');
      
      // Set full library
      setLibrary(updatedLibrary);
      
      // Update recent tracks (sorted by addedAt)
      const sortedByRecent = [...updatedLibrary].sort((a, b) => 
        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
      setRecentTracks(sortedByRecent);
      
      // Show notification
      showNotification('Your music library has been updated');
      triggerHaptic('light');
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('reconnect');
        socketRef.current.off('error');
        socketRef.current.off('newAudio');
        socketRef.current.off('deletedAudio');
        socketRef.current.off('libraryUpdate');
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  // Load initial library data
  useEffect(() => {
    loadLibrary();
  }, []);
  
  // Show notification
  const showNotification = (message: string) => {
    setNewDataNotification(message);
    
    // Show Android toast
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNewDataNotification(null);
    }, 3000);
  };
  
  const loadLibrary = async () => {
    try {
      setLoading(true);
      const data = await getSavedAudios();
      
      // Set full library
      setLibrary(data as LibraryItem[]);
      
      // Set recent tracks (sorted by addedAt)
      const sortedByRecent = [...data].sort((a, b) => 
        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
      setRecentTracks(sortedByRecent as LibraryItem[]);
      
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadLibrary();
    triggerHaptic('light');
    
    // Reconnect socket if not connected
    if (!socketConnected && socketRef.current) {
      socketRef.current.connect();
    }
  };
  
  // Function to trigger haptic feedback with platform safety
  const triggerHaptic = (type: string) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (type === 'light') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (type === 'medium') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch (error) {
        // Fail silently - haptics not critical
      }
    }
  };
  
  // For YouTube search results:
  const onYouTubeItemPressed = (video: VideoResult) => {
    handleVideoPlay(video);
    triggerHaptic('medium');
  };
  
  // For library tracks:
  const onLibraryItemPressed = (item: { _id: string }) => {
    toggleAudio(item._id);
    triggerHaptic('light');
  };
  
  const renderHeader = () => (
    <Animated.View style={[
      styles.header, 
      { 
        height: headerHeight,
        paddingTop: insets.top + 8,
        paddingLeft: insets.left + 16,
        paddingRight: insets.right + 16
      }
    ]}>
      <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
        <Text style={styles.headerTitle}>Your Music</Text>
        <Text style={styles.headerSubtitle}>
          Listen to your saved tracks and downloads
          {socketConnected ? ' • Live Updates On' : ''}
        </Text>
      </Animated.View>
    </Animated.View>
  );
  
  const renderEmptyState = () => {
    if (loading || library.length > 0) return null;
    
    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name="musical-notes" 
          size={isTablet ? 100 : 80} 
          color="#1DB954" 
        />
        <Text style={styles.emptyStateTitle}>
          No music yet
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          Explore and add songs to your library from the Explore tab
        </Text>
      </View>
    );
  };
  
  return (
    <View style={[
      styles.container,
      { 
        paddingBottom: insets.bottom,
      }
    ]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#121212" 
        translucent={Platform.OS === 'android'} 
      />
      
      {/* Animated Header */}
      {renderHeader()}
      
      {/* Loading State */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size={Platform.OS === 'ios' ? "large" : 48} 
            color="#1DB954" 
          />
          <Text style={styles.loadingText}>
            Loading your music...
          </Text>
        </View>
      ) : (
        <>
          {/* Empty State */}
          {renderEmptyState()}
          
          {/* Content - Recents & Library */}
          {library.length > 0 && (
            <Animated.ScrollView
              contentContainerStyle={[
                styles.scrollContent, 
                { 
                  paddingTop: 100,
                  paddingLeft: insets.left + 16,
                  paddingRight: insets.right + 16,
                  paddingBottom: 30
                }
              ]}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#1DB954"
                  colors={["#1DB954"]}
                  progressBackgroundColor="#2a2a2a"
                />
              }
            >
              {/* Recent Downloads Section */}
              <RecentSection 
                title="Recently Added" 
                data={recentTracks}
                onPlay={onLibraryItemPressed}
                currentTrackId={currentTrackId || ''}
                isPlaying={isPlaying}
              />
              
              {/* Library Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Your Library</Text>
                <View style={styles.libraryContainer}>
                  {library.map((item: LibraryItem) => (
                    <TrackCard 
                      key={item._id}
                      item={item}
                      onPlay={() => onLibraryItemPressed(item)}
                      isPlaying={currentTrackId === item._id && isPlaying}
                    />
                  ))}
                </View>
              </View>
            </Animated.ScrollView>
          )}
        </>
      )}
      
      {/* New Data Notification */}
      {newDataNotification && Platform.OS === 'ios' && (
        <Animated.View style={styles.notificationBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#1DB954" />
          <Text style={styles.notificationText}>{newDataNotification}</Text>
        </Animated.View>
      )}
      
      {/* Connection Status Indicator */}
      {!socketConnected && (
        <TouchableOpacity 
          style={styles.connectionIndicator}
          onPress={() => {
            if (socketRef.current) {
              socketRef.current.connect();
              triggerHaptic('light');
            }
          }}
        >
          <Ionicons name="wifi-outline" size={16} color="#888" />
          <Text style={styles.connectionText}>Offline • Tap to reconnect</Text>
        </TouchableOpacity>
      )}
      
      {/* Loading Overlays */}
      <LoadingOverlay 
        visible={isConverting} 
        message={`Converting "${convertingTitle}"\nto audio format...`}
      />
      
      {isDownloading && (
        <View style={styles.downloadingIndicator}>
          <ActivityIndicator size="small" color="#1DB954" />
          <Text style={styles.downloadingText}>Downloading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#121212',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  headerContent: {
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 0,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#b3b3b3',
    fontSize: 15,
    marginBottom: 20
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#b3b3b3',
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recentsList: {
    paddingBottom: 8,
  },
  recentItem: {
    width: 160,
    marginRight: 16,
  },
  recentImageContainer: {
    width: 160,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  activeOverlay: {
    opacity: 1,
    backgroundColor: 'rgba(29,185,84,0.7)',
  },
  recentTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  recentArtist: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  libraryContainer: {
    marginBottom: 20,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    ...(Platform.OS === 'ios' 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 } 
      : { elevation: 2 })
  },
  trackThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  trackArtist: {
    color: '#b3b3b3',
    fontSize: 14,
    marginBottom: 2,
  },
  trackMeta: {
    color: '#999',
    fontSize: 12,
  },
  playButton: {
    backgroundColor: '#1DB954',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  pauseButton: {
    backgroundColor: '#444',
  },
  notificationBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...(Platform.OS === 'ios' 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 } 
      : { elevation: 4 })
  },
  notificationText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  connectionIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectionText: {
    color: '#bbb',
    marginLeft: 6,
    fontSize: 12,
  },
  downloadingIndicator: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...(Platform.OS === 'ios' 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 } 
      : { elevation: 4 })
  },
  downloadingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
});