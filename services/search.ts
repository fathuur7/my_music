import axios from "axios";

const API_BASE_URL = "http://192.168.1.42:5000/api";

export async function search(query: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/search`, {
      params: { q: query },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data; 
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; 
  }
}
