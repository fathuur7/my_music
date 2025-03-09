import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function Page() {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Image
          style={styles.musicImage}
          source={require('../assets/images/icon.png')}
          // Note: Add a music-related image to your assets folder
          // If you don't have one yet, you can replace this with a placeholder
        />
        <Text style={styles.title}>MusicHub</Text>
        <Text style={styles.subtitle}>Your personal music experience</Text>
        
        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  musicImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: "#B3B3B3",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1DB954", // Spotify green color
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});