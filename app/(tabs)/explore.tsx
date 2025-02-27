import React, { useState, useEffect, useRef } from 'react';
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
  Pressable
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { searchArtist } from '../../services/deezerService';
import TrackCard from '../../components/TrackCard/TrackCard';
import useAudioPlayer from '../../hooks/useAudioPlayer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
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
      const data = await searchArtist(query);
      setTracks(data);
      
      // Add to recent searches
      if (!recentSearches.includes(query)) {
        const newRecentSearches = [query, ...recentSearches.slice(0, 4)];
        setRecentSearches(newRecentSearches);
      }
      
      triggerHaptic('success');
      
    } catch (error) {
      console.error('Error:', error);
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
        <Text style={styles.headerTitle}>Discover new music</Text>
        <Text style={styles.headerSubtitle}>Search for artists, songs, and more</Text>
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
          placeholder="Search for artists, songs, or podcasts"
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
    if (loading || tracks.length > 0) return null;
    
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
          Find your favorite artists, songs, and more
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
            data={tracks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TrackCard
                track={item}
                onPlay={() => {
                  playSound(item.preview, item.id);
                  triggerHaptic('medium');
                }}
                isPlaying={currentlyPlayingId === item.id && isPlaying}
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
            maxToRenderPerBatch={8}
            windowSize={10}
          />
        </>
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
});