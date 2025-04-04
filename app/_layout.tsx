import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StatusBar, Text } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayoutNav() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const [clerkError, setClerkError] = useState(false);
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  // Hide splash screen when resources are loaded
  useEffect(() => {
    const hideSplash = async () => {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    };

    hideSplash();
  }, [fontsLoaded]);

  // Error handling for missing API key
  if (!publishableKey) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: '#E53E3E', marginBottom: 12, fontWeight: 'bold' }}>
            Configuration Error
          </Text>
          <Text style={{ fontSize: 16, color: '#333', textAlign: 'center' }}>
            Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable. Please check your environment configuration.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Show a loading screen while fonts are still loading
  if (!fontsLoaded) {
    return null; // This will keep the splash screen visible
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ClerkProvider 
        publishableKey={publishableKey}
      >
        {clerkError ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, color: '#E53E3E', marginBottom: 12, fontWeight: 'bold' }}>
              Authentication Error
            </Text>
            <Text style={{ fontSize: 16, color: '#333', textAlign: 'center' }}>
              There was a problem connecting to the authentication service. Please check your network connection and try again.
            </Text>
          </View>
        ) : (
          <ClerkLoaded>
            <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
              <Slot />
            </View>
          </ClerkLoaded>
        )}
      </ClerkProvider>
    </SafeAreaProvider>
  );
}