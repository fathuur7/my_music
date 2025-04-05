import LoadingOverlay from '../../components/loading/loadingOverlay';
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TextInput, 
  TouchableOpacity,
  Animated,
  Keyboard,
  StatusBar,
  Platform,
  useWindowDimensions,
  Pressable,
  Image,
  GestureResponderEvent,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { search } from '../../services/search';
import useAudioPlayer from '../../hooks/useAudioPlayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { getAudioFromYouTube } from '../../services/youtube-service';

// Updated interface to match YouTube search results format
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

interface SearchResponse {
  success: boolean;
  query: string;
  totalResults: number;
  results: VideoResult[];
}

interface VideoCardProps {
  video: VideoResult;
  onPlay: () => void;
  isPlaying: boolean;
}

// VideoCard component - defined once and outside the main component
const VideoCard = ({ video, onPlay, isPlaying }: VideoCardProps) => {
  const handlePlayButtonPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onPlay();
  };

  return (
    <TouchableOpacity 
      style={styles.videoCard}
      onPress={onPlay}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: video.thumbnail }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
        <Text style={styles.channelName}>{video.author}</Text>
        <View style={styles.videoStats}>
          <Text style={styles.videoViews}>{video.views} views</Text>
          <Text style={styles.videoViews}> • </Text>
          <Text style={styles.videoViews}>{video.uploadedAt}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.playButton, isPlaying ? styles.pauseButton : null]}
        onPress={handlePlayButtonPress}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
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

export default function ExploreScreen() {
  
  // State for audio conversion loading
  const [isConverting, setIsConverting] = useState(false);
  const [convertingTitle, setConvertingTitle] = useState('');
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const { playSound, pauseSound, isPlaying, currentlyPlayingId } = useAudioPlayer();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const dimensions = useWindowDimensions();
  const isTablet = dimensions.width >= 768;

  // Animation values for more compact header
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

  // Function to trigger haptic feedback with platform safety
  const triggerHaptic = (type: 'success' | 'error' | 'light' | 'medium') => {
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

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    Keyboard.dismiss();
    setLoading(true);
    setShowRecent(false);
    
    try {
      // Call search service and extract results array
      const response = await search(query) as SearchResponse;
      
      if (response.success && response.results) {
        setVideos(response.results);
        setTotalResults(response.totalResults);
        
        // Add to recent searches
        if (!recentSearches.includes(query)) {
          const newRecentSearches = [query, ...recentSearches.slice(0, 4)];
          setRecentSearches(newRecentSearches);
        }
        
        triggerHaptic('success');
      } else {
        setVideos([]);
        triggerHaptic('error');
      }
      
    } catch (error) {
      setVideos([]);
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    setShowRecent(true);
  };

  const handleInputBlur = () => {
    // Delay hiding recent searches to allow for taps
    setTimeout(() => {
      if (inputRef.current && !inputRef.current.isFocused()) {
        setShowRecent(false);
      }
    }, 150);
  };

  const handleRecentSearchSelect = (searchTerm: string) => {
    setQuery(searchTerm);
    inputRef.current?.blur();
    setShowRecent(false);
    
    triggerHaptic('light');
    
    setTimeout(() => {
      setQuery(searchTerm);
      handleSearch();
    }, 150);
  };

  // Fixed handleVideoPlay function
  const handleVideoPlay = async (video: VideoResult) => {
    try {
      // If the same video is playing, pause it
      if (currentlyPlayingId === video.id.toString() && isPlaying) {
        pauseSound();
        return;
      }
      
      // Show converting indicator
      setIsConverting(true);
      setConvertingTitle(video.title);
      
      // Try to get audio from the backend - pass the full video data for storage
      const audioUrl = await getAudioFromYouTube(video.url, {
        title: video.title,
        author: video.author,
        thumbnail: video.thumbnail,
        duration: video.duration,
        durationInSeconds: video.durationInSeconds
      });
      
      console.log("Audio URL received:", audioUrl);
      
      // Play the audio with our useAudioPlayer hook
      playSound({ 
        previewUrl: audioUrl, 
        trackId: video.id.toString()
      });
      
      // Provide haptic feedback for successful play
      triggerHaptic('medium');
      
    } catch (error) {
      console.error('Error playing audio:', error);
      
      // Show error to user
      Alert.alert(
        "Playback Error", 
        "Could not convert or play this video's audio. Please try again later.",
        [{ text: "OK" }]
      );
      
      triggerHaptic('error');
    } finally {
      // Hide converting indicator
      setIsConverting(false);
      setConvertingTitle('');
    }
  };

  const numColumns = isTablet ? 2 : 1;

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
        <Text style={styles.headerTitle}>Explore Music</Text>
        <Text style={styles.headerSubtitle}>Search for artists, songs, and videos</Text>
      </Animated.View>
    </Animated.View>
  );

  const renderSearchBar = () => (
    <Animated.View style={[
      styles.searchContainer,
      { 
        paddingLeft: insets.left + 16, 
        paddingRight: insets.right + 16,
        transform: [
          { translateY: scrollY.interpolate({
            inputRange: [0, 60],
            outputRange: [0, -10],
            extrapolate: 'clamp'
          })}
        ],
        zIndex: 5
      }
    ]}>
      <View style={[
        styles.inputContainer,
        Platform.OS === 'ios' ? styles.inputIOS : styles.inputAndroid
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color="#999" 
          style={styles.searchIcon} 
        />
        <TextInput
          ref={inputRef}
          placeholder="Search for music videos, artists, songs"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          selectionColor="#1DB954"
          clearButtonMode={Platform.OS === 'ios' ? "while-editing" : "never"}
        />
        {query.length > 0 && Platform.OS !== 'ios' && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        style={[
          styles.searchButton,
          Platform.OS === 'ios' ? styles.buttonIOS : styles.buttonAndroid
        ]}
        onPress={handleSearch}
        activeOpacity={0.7}
      >
        <MaterialIcons name="search" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => {
    if (loading || videos.length > 0) return null;
    
    return (
      <View style={[styles.emptyState, isTablet && styles.emptyStateTablet]}>
        <Ionicons 
          name="search-circle" 
          size={isTablet ? 100 : 80} 
          color="#1DB954" 
        />
        <Text style={[styles.emptyStateTitle, isTablet && styles.tabletText]}>
          Search for music
        </Text>
        <Text style={[styles.emptyStateSubtitle, isTablet && styles.tabletSubText]}>
          Find your favorite artists, songs, and videos
        </Text>
      </View>
    );
  };

  const renderRecentSearches = () => {
    if (!showRecent || recentSearches.length === 0) return null;
    
    return (
      <View style={[
        styles.recentSearchesContainer, 
        { 
          marginLeft: insets.left + 16, 
          marginRight: insets.right + 16,
          zIndex: 10
        }
      ]}>
        <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
        {recentSearches.map((search, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.recentSearchItem,
              pressed && styles.pressedItem,
              index === recentSearches.length - 1 && { borderBottomWidth: 0 }
            ]}
            onPress={() => handleRecentSearchSelect(search)}
            android_ripple={{ color: '#333333' }}
          >
            <Ionicons name="time-outline" size={18} color="#999" />
            <Text style={styles.recentSearchText}>{search}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderSearchResults = () => {
    if (videos.length === 0) return null;
    
    return (
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {totalResults} results for "{query}"
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
      {/* Status Bar customization based on platform */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#121212" 
        translucent={Platform.OS === 'android'} 
      />
      
      {/* Animated Header */}
      {renderHeader()}
      
      {/* Search Bar */}
      {renderSearchBar()}
      
      {/* Recent Searches */}
      {renderRecentSearches()}
      
      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size={Platform.OS === 'ios' ? "large" : 48} 
            color="#1DB954" 
          />
          <Text style={[styles.loadingText, isTablet && styles.tabletText]}>
            Searching for "{query}"...
          </Text>
        </View>
      ) : (
        <>
          {/* Empty State */}
          {renderEmptyState()}
          
          {/* Results */}
          <FlatList
            key={`list-${numColumns}`}
            data={videos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <VideoCard
                video={item}
                onPlay={() => handleVideoPlay(item)}
                isPlaying={currentlyPlayingId === item.id.toString() && isPlaying}
              />
            )}
            numColumns={numColumns}
            contentContainerStyle={[
              styles.listContent,
              { 
                paddingLeft: insets.left + 16, 
                paddingRight: insets.right + 16,
                paddingTop: 64,  // Added padding to account for search bar overlay
              }
            ]}
            ListHeaderComponent={renderSearchResults}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={{ height: 30 }} />}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={10}
          />
        </>
      )}
      
      {/* LoadingOverlay for audio conversion */}
      <LoadingOverlay 
        visible={isConverting} 
        message={`Converting "${convertingTitle}"\nto audio format...`}
      />
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
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    color: '#b3b3b3',
    fontSize: 15,
    letterSpacing: 0.2,
    marginBottom: 20
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 100,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 50,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  inputIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  inputAndroid: {
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    height: '100%',
    paddingTop: 0,
    paddingBottom: 0,
  },
  clearButton: {
    padding: 6,
  },
  searchButton: {
    backgroundColor: '#1DB954',
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonAndroid: {
    elevation: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
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
    marginTop: 60,
  },
  emptyStateTablet: {
    paddingHorizontal: 80,
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
  recentSearchesContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginTop: 165,  // Positioned below search bar
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
    ...(Platform.OS === 'ios' 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4 } 
      : { elevation: 5 })
  },
  recentSearchesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  pressedItem: {
    backgroundColor: Platform.OS === 'ios' ? '#2a2a2a' : undefined,
  },
  recentSearchText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 15,
  },
  tabletText: {
    fontSize: 24,
  },
  tabletSubText: {
    fontSize: 18,
  },
  resultsHeader: {
    marginBottom: 16,
    paddingTop: 8,
  },
  resultsCount: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  // Styles for the VideoCard component
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    ...(Platform.OS === 'ios' 
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 } 
      : { elevation: 2 })
  },
  thumbnailContainer: {
    width: 120,
    height: 72,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    padding: 2,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  channelName: {
    color: '#b3b3b3',
    fontSize: 12,
    marginBottom: 4,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoViews: {
    color: '#999',
    fontSize: 11,
  },
  playButton: {
    backgroundColor: '#1DB954',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft: 8,
  },
  pauseButton: {
    backgroundColor: '#444',
  },
});