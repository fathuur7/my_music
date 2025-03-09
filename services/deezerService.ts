import axios from 'axios';

const API_KEY ="d950cce957mshb42913347a7457cp1dfe38jsn9c2fc9f52bd0"
const API_URL ="https://deezerdevs-deezer.p.rapidapi.com"

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
