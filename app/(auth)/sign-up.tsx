import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Show a loading indicator while checking auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  // Redirect to home if already signed in
  if (isSignedIn) {
    return <Redirect href={'/'} />;
  }

  // Return the stack navigator with styling for auth screens
  // Apply different styling based on platform for better cross-platform compatibility
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#4285F4',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: Platform.OS !== 'web', // Shadow might render differently on web
        headerBackTitle: Platform.OS === 'ios' ? 'Back' : undefined, // iOS specific property
        contentStyle: {
          backgroundColor: '#f9f9f9',
        },
        // Only use animation on native platforms where it's fully supported
        ...(Platform.OS !== 'web' && { animation: 'slide_from_right' }),
      }}
    >
      <Stack.Screen
        name="signin"
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Reset Password',
        }}
      />
    </Stack>
  );
}