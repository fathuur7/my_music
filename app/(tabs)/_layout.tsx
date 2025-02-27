import { Tabs } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

// Custom Tab Bar Icon component with label
const TabIcon = ({ focused, color, name, label} : any) => {
  return (
    <View style={styles.tabIconContainer}>
      <MaterialIcons 
        name={name} 
        size={focused ? 26 : 22} 
        color={color} 
      />
      <Text style={[
        styles.tabLabel, 
        { color: color, fontWeight: focused ? '600' : '400' }
      ]}>
        {label}
      </Text>
    </View>
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1DB954', // Spotify green for active tab
        tabBarInactiveTintColor: '#b3b3b3', // Gray for inactive tab
        tabBarStyle: {
          backgroundColor: 'rgba(18, 18, 18, 0.98)', // Almost black with slight transparency
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom, // Taller tab bar with safe area padding
          paddingBottom: insets.bottom, // Safe area padding for bottom
          paddingTop: 6, // Extra padding on top for better touch targets
          position: 'absolute', // Make it float
          borderTopLeftRadius: 16, // Rounded corners
          borderTopRightRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
        },
        headerShown: false, // Hide default header
        tabBarLabelStyle: {
          display: 'none', // Hide default labels since we're using custom ones
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              name="home-filled" 
              label="" 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              name="search" 
              label="" 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="library"
        options={{
          title: 'Your Library',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              name="library-music" 
              label="" 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="premium"
        options={{
          title: 'Premium',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              focused={focused} 
              color={color} 
              name="workspace-premium" 
              label="" 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});