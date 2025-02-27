import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function Layout() {
  const insets = useSafeAreaInsets();
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Status Bar Customization */}
      <StatusBar style="light" backgroundColor="#1DB954" />

      {/* Main Stack Navigator */}
      <Stack screenOptions={{
        headerTransparent: true,
        headerBlurEffect: 'dark',
        animation: 'fade_from_bottom',
      }}>
        {/* Home Screen (Tabs) */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false, // Hide default header
          }}
        />

        {/* Example of a Custom Header for Other Screens */}
        <Stack.Screen
          name="details" // Replace with your screen name
          options={({ navigation }) => ({
            title: 'Track Details', // Custom title
            headerStyle: styles.header, // Custom header style
            headerTintColor: '#fff', // Text color
            headerTitleStyle: styles.headerTitle, // Title style
            headerBackground: () => (
              <BlurView intensity={90} tint="dark" style={[styles.headerBlur, { paddingTop: insets.top }]} />
            ),
            headerLeft: () => (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back-circle" size={32} color="#fff" />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={styles.headerRightContainer}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => console.log('Share pressed')}
                >
                  <Ionicons name="share-social-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => console.log('More options pressed')}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ),
          })}
        />
        
        {/* Settings Screen with Custom Header */}
        <Stack.Screen
          name="settings"
          options={({ navigation }) => ({
            title: 'Settings',
            headerStyle: styles.header,
            headerTintColor: '#fff',
            headerTitleStyle: styles.headerTitle,
            headerBackground: () => (
              <BlurView intensity={90} tint="dark" style={[styles.headerBlur, { paddingTop: insets.top }]} />
            ),
            headerLeft: () => (
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back-circle" size={32} color="#fff" />
              </TouchableOpacity>
            ),
          })}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Spotify dark background
  },
  header: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    height: 60,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(29, 185, 84, 0.7)', // Semi-transparent Spotify green
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});