import React from 'react'
import * as WebBrowser from 'expo-web-browser'
import { Text, View, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Link } from 'expo-router'
import { useOAuth } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Ionicons } from '@expo/vector-icons'

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Only run browser warm-up/cool-down on native platforms
    if (Platform.OS !== 'web') {
      // Warm up the android browser to improve UX
      // https://docs.expo.dev/guides/authentication/#improving-user-experience
      void WebBrowser.warmUpAsync()
      return () => {
        void WebBrowser.coolDownAsync()
      }
    }
    // No-op for web platform
    return () => {}
  }, [])
}

// Only attempt to complete auth session if not on web
if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession()
}

export default function Page() {
  useWarmUpBrowser()

  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const onPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/app/(tabs)/index', { scheme: 'myapp' }),
      })

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
      } else {
        // Use signIn or signUp returned from startOAuthFlow
        // for next steps, such as MFA
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }, [])

  return (
    <View style={styles.container}>
      <Link href="/" style={styles.homeLink}>
        <Text style={styles.homeLinkText}>Home</Text>
      </Link>
      
      <TouchableOpacity 
        style={styles.googleButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.googleIconContainer}>
          <Ionicons name="logo-google" size={20} color="#EA4335" />
        </View>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  homeLink: {
    marginBottom: 20,
  },
  homeLinkText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 300,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleIconContainer: {
    marginRight: 12,
  },
  buttonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  }
})