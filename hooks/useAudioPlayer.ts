import { useState, useEffect } from 'react';
import { Audio, AVPlaybackStatus, InterruptionModeAndroid , InterruptionModeIOS} from 'expo-av';

const useAudioPlayer = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  // Cleanup when the component unmounts or when a new sound is loaded
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  interface PlaySoundParams {
    previewUrl: string;
    trackId: string | null;
  }

  const playSound = async ({ previewUrl, trackId }: PlaySoundParams): Promise<void> => {
    try {
      // If same track is already loaded, toggle play/pause
      if (currentlyPlayingId === trackId && sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // Stop and unload any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      console.log("Loading sound from URL:", previewUrl);

      // (Optional) Request audio permissions — mostly needed for iOS standalone builds
      const { status } = await Audio.requestPermissionsAsync?.();
      if (status && status !== 'granted') {
        console.error('Audio permissions not granted');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true, volume: 1.0 }
      );

      setSound(newSound);
      setCurrentlyPlayingId(trackId);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
          setIsPlaying(false);
          setCurrentlyPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlaying(false);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      try {
        await sound.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing sound:', error);
      }
    }
  };

  return { playSound, pauseSound, isPlaying, currentlyPlayingId };
};

export default useAudioPlayer;
