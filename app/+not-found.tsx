import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Oops!' }} />

      <Text style={styles.text}>
        <Text style={styles.textBold}>404 - </Text>
        {' '} page not found
      </Text>

      <Link href="/" style={styles.link}>
        Go to root screen!
      </Link>
      <Link href="/(tabs)" style={styles.link}>
        Go to home screen!
      </Link>
      <Link href="./(tabs)/index" style={styles.link}>
        Go to library screen!
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  textBold: {
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

