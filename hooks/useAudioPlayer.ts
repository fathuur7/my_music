import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

const useAudioPlayer = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<number | null>(null);

  useEffect(() : any => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  const playSound = async (previewUrl: string, trackId: number) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: previewUrl });
      setSound(newSound);
      setCurrentlyPlayingId(trackId);
      await newSound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  return { playSound, pauseSound, isPlaying, currentlyPlayingId };
};

export default useAudioPlayer;