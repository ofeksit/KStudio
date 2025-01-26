import { Injectable } from '@angular/core';
import { Observable  } from 'rxjs';
import { HttpClient, HttpHeaders  } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private apiUrl = 'https://k-studio.co.il/wp-json/training-music/v1';  
  private clientId = 'fa073b7f5b3542058bf6f409408d0f9c';
  private clientSecret = '5661085454064f63bc8f45d47c1e547c';
  private refreshToken = 'AQAb5-TyNlBTlp-Dd4pvobzKcoC1KxoFaT3KlBnNXjMr8o_73j8MpAACMMwEzDqgi4289WYnItLMlOsm9mA9zorf5fyy-KpYgCZlt3c-zLKjmA8j7fUDpd5yPg3nG7r1vcI'; // Store the refresh token permanently
  private spotifyUserId = ''; // Will be fetched dynamically

  constructor(private http:HttpClient) { 
    this.getSpotifyUserId(); // Fetch User ID on service initialization
  }

  //#region Spotify Configuration

  async getSpotifyToken(): Promise<string> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
      },
      body: `grant_type=refresh_token&refresh_token=${this.refreshToken}`
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error('Spotify Token Error:', errorMessage);
      throw new Error('Failed to refresh Spotify token');
    }

    const data = await response.json();
    console.log('New Spotify Access Token:', data.access_token);
    return data.access_token; // Use this access token in API calls
  }

  async getSpotifyUserId() {
    const token = await this.getSpotifyToken();
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      console.error('Error fetching Spotify User ID');
      return;
    }

    const data = await response.json();
    this.spotifyUserId = data.id;
    console.log('Spotify User ID:', this.spotifyUserId);
  }
  
  
  async searchSongs(query: string) {
    const token = await this.getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error('Spotify Search Error:', errorMessage);
      throw new Error('Failed to fetch songs from Spotify');
    }
  
    const data = await response.json();
    return data.tracks?.items || [];
  }  

  //#endregion


  getSongsForTraining(trainingId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-songs/?training_id=${trainingId}`);
  }

  addSongToTraining(trainingId: number, userId: string | null, song: any): Observable<any> {
    const body = {
      training_id: trainingId,
      user_id: userId,
      song_id: song.id,
      song_name: song.name,
      artist_name: song.artists[0]?.name || 'UNKNOWN',
      artist_image: song.album?.images[0]?.url || 'UNKNOWN',
    };

    return this.http.post(`${this.apiUrl}/add-song`, body);
  }

  removeSongFromTraining(trainingId: number, userId: string | null, songId: string): Observable<any> {
    const body = {
      training_id: trainingId,
      user_id: userId,
      song_id: songId,
    };

    return this.http.post(`${this.apiUrl}/remove-song/`, body);
  }

  async createPlaylist(playlistName: string): Promise<any> {
    if (!this.spotifyUserId) {
      console.error('Spotify User ID not available');
      return;
    }
  
    const token = await this.getSpotifyToken();
    const url = `https://api.spotify.com/v1/users/${this.spotifyUserId}/playlists`;
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  
    const body = {
      name: playlistName,
      description: 'Training Playlist',
      public: false,
    };
  
    try {
      const response = await this.http.post<any>(url, body, { headers }).toPromise();
      console.log("פלייליסט נוצר בהצלחה");
      return response; // Ensure the response is properly returned
    } catch (error) {
      console.error("Error creating Spotify playlist:", error);
      throw error;
    }
  }
  

  async addSongsToPlaylist(playlistId: string, songUris: string[]): Promise<any> {
    const token = await this.getSpotifyToken();
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    const body = {
      uris: songUris,
    };

    return this.http.post(url, body, { headers }).toPromise();
  }

}
