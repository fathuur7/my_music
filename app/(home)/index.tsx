import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native'
// import { SignOutButton } from "@/components/auth/SignOutButton"

export default function home() {
  const { user } = useUser()

  return (
    <View style={styles.container}>
      <SignedIn>
        <View style={styles.welcomeContainer}>
          <Image 
            source={{ uri: user?.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
            style={styles.profileImage}
          />
          <Text style={styles.welcomeText}>
            Welcome, {user?.firstName || user?.emailAddresses[0].emailAddress.split('@')[0]}!
          </Text>
          <Text style={styles.emailText}>
            {user?.emailAddresses[0].emailAddress}
          </Text>
          
          <View style={styles.actionsContainer}>
            <Link href="/(tabs)/explore" asChild>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Go to Dashboard</Text>
              </TouchableOpacity>
            </Link>
            
            {/* <View style={styles.signOutButtonWrapper}>
              <SignOutButton />
            </View> */}
          </View>
        </View>
      </SignedIn>
      
      <SignedOut>
        <View style={styles.authContainer}>
          <Text style={styles.appTitle}>Your App Name</Text>
          <Text style={styles.appDescription}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quam velit.
          </Text>
          
          <View style={styles.authButtonsContainer}>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity style={styles.signInButton}>
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
            
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity style={styles.signUpButton}>
                <Text style={styles.signUpButtonText}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </SignedOut>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
    justifyContent: 'center',
  },
  // Signed In styles
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  signOutButtonWrapper: {
    marginTop: 8,
  },
  // Signed Out styles
  authContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  authButtonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  signInButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  signUpButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  signUpButtonText: {
    color: '#4285F4',
    fontWeight: '600',
    fontSize: 16,
  },
});