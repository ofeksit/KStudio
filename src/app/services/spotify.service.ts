import { Injectable } from '@angular/core';
import { Observable  } from 'rxjs';
import { HttpClient  } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private apiUrl = 'https://k-studio.co.il/wp-json/training-music/v1';


  constructor(private http:HttpClient) { }

  //#region Spotify Configuration

  async getSpotifyToken() {
    const clientId = 'fa073b7f5b3542058bf6f409408d0f9c';
    const clientSecret = '5661085454064f63bc8f45d47c1e547c';
  
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: 'grant_type=client_credentials'
    });
  
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error('Spotify Token Error:', errorMessage);
      throw new Error('Failed to get Spotify token');
    }
  
    const data = await response.json();
    return data.access_token;
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

  removeSongFromTraining(trainingId: number, userId: string | null, songId: string): Observable<any>{
    const body = {
      training_id: trainingId,
      user_id: userId,
      song_id: songId,
    };

    return this.http.post(`${this.apiUrl}/remove-song/`, body);
  }
}
