// Combined audio player with YouTube conversion and downloaded audio playback

// services/set.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';

interface VideoResult {
  id: string | number;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  durationInSeconds: number;
}

interface AudioPlayerState {
  currentSound: Audio.Sound | null;
  isPlaying: boolean;
  currentTrackId: string | null;
  isConverting: boolean;
  convertingTitle: string;
  isDownloading: boolean;
}

export function useAudioPlayer() {
  const [state, setState] = useState<AudioPlayerState>({
    currentSound: null,
    isPlaying: false,
    currentTrackId: null,
    isConverting: false,
    convertingTitle: '',
    isDownloading: false
  });

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'error') => {
    // Implement haptic feedback logic here
    // This is just a placeholder - you'd need to use a library like expo-haptics
    console.log(`Haptic feedback triggered: ${type}`);
  };

  // Function to download audio from YouTube video
  const getAudioFromYouTube = async (videoUrl: string, metadata: any) => {
    try {
      setState(prev => ({ ...prev, isConverting: true, convertingTitle: metadata.title }));
      
      // Make an API call to your backend
      const response = await fetch('http://192.168.1.42:5000/api/audio/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoUrl,
          title: metadata.title,
          artist: metadata.author,
          thumbnail: metadata.thumbnail,
          duration: metadata.duration,
          durationInSeconds: metadata.durationInSeconds
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to convert video');
      }
      
      // Return the URL to the downloaded audio
      return `http://192.168.1.42:5000/api/audio/download/${data.audioId}`;
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isConverting: false, convertingTitle: '' }));
    }
  };

  // Play audio from a YouTube video
  const handleVideoPlay = async (video: VideoResult) => {
    try {
      // If the same video is playing, pause it
      if (state.currentTrackId === video.id.toString() && state.isPlaying) {
        pauseSound();
        return;
      }
      
      // Show converting indicator
      setState(prev => ({ 
        ...prev, 
        isConverting: true, 
        convertingTitle: video.title 
      }));
      
      // Try to get audio from the backend
      const audioUrl = await getAudioFromYouTube(video.url, {
        title: video.title,
        author: video.author,
        thumbnail: video.thumbnail,
        duration: video.duration,
        durationInSeconds: video.durationInSeconds
      });
      
      console.log("Audio URL received:", audioUrl);
      
      // Extract the ID from the URL
      const urlParts = audioUrl.split('/');
      const audioId = urlParts[urlParts.length - 1];
      
      // Play the downloaded audio
      await playAudio(audioId);
      
      // Provide haptic feedback for successful play
      triggerHaptic('medium');
      
    } catch (error) {
      console.error('Error playing audio:', error);
      
      // Show error to user
      Alert.alert(
        "Playback Error", 
        "Could not convert or play this video's audio. Please try again later.",
        [{ text: "OK" }]
      );
      
      triggerHaptic('error');
    } finally {
      // Hide converting indicator
      setState(prev => ({ 
        ...prev, 
        isConverting: false, 
        convertingTitle: '' 
      }));
    }
  };

  // Play already downloaded audio by ID
  const playAudio = async (id: string) => {
    try {
      // Stop current track if there is one
      if (state.currentSound) {
        await state.currentSound.stopAsync();
        await state.currentSound.unloadAsync();
      }

      setState(prev => ({ ...prev, isDownloading: true }));

      // Get the audio URL from your API
      const audioUrl = `http://192.168.1.42:5000/api/audio/download/${id}`;
      
      // Create and play the audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setState(prev => ({
        ...prev,
        currentSound: sound,
        isPlaying: true,
        currentTrackId: id,
        isDownloading: false
      }));
      
      // Add status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState(prev => ({
            ...prev,
            isPlaying: false,
            currentTrackId: null
          }));
        }
      });
      
    } catch (error) {
      console.error("Failed to play audio:", error);
      setState(prev => ({ ...prev, isDownloading: false }));
      Alert.alert("Playback Error", "Failed to play the audio track.");
    }
  };

  // Pause the currently playing sound
  const pauseSound = async () => {
    if (state.currentSound) {
      await state.currentSound.pauseAsync();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };
  
  // Resume the currently paused sound
  const resumeSound = async () => {
    if (state.currentSound) {
      await state.currentSound.playAsync();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  // Play or pause toggle for already downloaded tracks
  const toggleAudio = async (id: string) => {
    const isActive = state.currentTrackId === id;
    
    if (isActive && state.isPlaying) {
      await pauseSound();
    } else if (isActive && !state.isPlaying) {
      await resumeSound();
    } else {
      await playAudio(id);
    }
  };

  return {
    ...state,
    playAudio,
    pauseSound,
    resumeSound,
    handleVideoPlay,
    toggleAudio
  };
}