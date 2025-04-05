import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.42:5000';

/**
 * Converts a YouTube video to audio and retrieves the audio URL
 * 
 * @param {string} videoUrl - The YouTube video URL to convert
 * @param {object} videoData - Additional video metadata 
 * @returns {Promise<string>} - The URL to the converted audio
 * 
 * 
 */

interface VideoData {
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  durationInSeconds: number;
}


export const getAudioFromYouTube = async (videoUrl: string, videoData: VideoData | null = null) => {
  try {
    // Create data object with relevant video information
    const payload = {
      videoData: {
        url: videoUrl,
        ...(videoData && {
          title: videoData.title,
          author: videoData.author,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration,
          durationInSeconds: videoData.durationInSeconds
        })
      }
    };

    // Send POST request to our backend conversion API
    const response = await axios.post(`${API_BASE_URL}/api/audio/convert`, payload);

    // Check if the response was successful
    if (response.data.success && response.data.audio) {
      // Return the full audio URL
      return `${API_BASE_URL}${response.data.audio.audioUrl}`;
    } else {
      console.error('Audio conversion failed:', response.data.message);
      throw new Error(response.data.message || 'Failed to convert video to audio');
    }
  } catch (error) {
    console.error('Error in getAudioFromYouTube:', error);
    throw error;
  }
};
/**
 * Get list of saved audios from the backend
 * 
 * @returns {Promise<Array>} - Array of audio objects
 */
export const getSavedAudios = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/audio/audios`);
    
    if (response.data.success) {
      return response.data.audios;
    } else {
      throw new Error(response.data.message || 'Failed to get saved audios');
    }
  } catch (error) {
    console.error('Error fetching saved audios:', error);
    throw error;
  }
};

// download audio from the server
export const downloadAudio = async (audioId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/audio/download/${audioId}`, { responseType: 'blob' });

    if (response.data.success) {
      return response.data.audio;
    } else {
      throw new Error(response.data.message || 'Failed to download audio');
    }
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw error;
  }
};


/**
 * Get a specific audio by ID
 * 
 * @param {string} audioId - The ID of the audio to retrieve
 * @returns {Promise<Object>} - Audio object
 */
export const getAudioById = async (audioId: string) => {
  try {
    if (!audioId) {
      throw new Error('Invalid audio ID');
    }
    // Fixed API URL path to match the pattern in your other functions
    const response = await axios.get(`${API_BASE_URL}/api/audio/audios/${audioId}`);
    
    if (response.data.success) {
      return response.data.audio;
    } else {
      throw new Error(response.data.message || 'Failed to get audio');
    }
  } catch (error) {
    console.error('Error fetching audio by ID:', error);
    throw error;
  }
};