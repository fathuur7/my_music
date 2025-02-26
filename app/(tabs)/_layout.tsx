import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1DB954', // Warna aktif (hijau Spotify)
        tabBarInactiveTintColor: '#b3b3b3', // Warna tidak aktif
        tabBarStyle: {
          backgroundColor: '#121212', // Warna latar tab bar
          borderTopWidth: 0, // Hilangkan garis atas
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="library-music" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}