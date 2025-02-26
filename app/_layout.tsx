import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function Layout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Status Bar Customization */}
      <StatusBar style="light" backgroundColor="#1DB954" />

      {/* Main Stack Navigator */}
      <Stack>
        Home Screen (Tabs)
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false, // Hide default header
          }}
        />

        {/* Example of a Custom Header for Other Screens */}
        <Stack.Screen
          name="details" // Replace with your screen name
          options={{
            title: 'Track Details', // Custom title
            headerStyle: styles.header, // Custom header style
            headerTintColor: '#fff', // Text color
            headerTitleStyle: styles.headerTitle, // Title style
            headerLeft: () => (
              <TouchableOpacity onPress={() => console.log('Go back')}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ), // Custom back button
            headerRight: () => (
              <TouchableOpacity onPress={() => console.log('Menu pressed')}>
                <Ionicons name="menu" size={24} color="#fff" />
              </TouchableOpacity>
            ), // Custom menu button
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', 
  },
  header: {
    backgroundColor: '#1DB954', // Spotify green color
    shadowOpacity: 0, // Remove shadow on iOS
    elevation: 0, // Remove shadow on Android
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});