import axios from 'axios';
import { API_URL, API_KEY } from '@env';
export const searchArtist = async (query: string) => {
  try {
    const response = await axios.get(`${API_URL}/search`, {
      params: { q: query },
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'deezerdevs-deezer.p.rapidapi.com',
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    
    throw error;
  }
};
