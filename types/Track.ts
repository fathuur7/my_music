export interface Artist {
    id: number;
    name: string;
    picture_medium: string;
  }
  
  export interface Album {
    id: number;
    title: string;
    cover_medium: string;
  }
  
  export interface Track {
    id: number;
    title: string;
    artist: Artist;
    album: Album;
    preview: string;
    duration: number;
  }