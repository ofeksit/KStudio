import { Injectable } from '@angular/core';
import { Observable  } from 'rxjs';
import { HttpClient, HttpHeaders  } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private apiUrl = 'https://k-studio.co.il/wp-json/training-music/v1';  
  private clientId = 'b46968a8339c459181a8fc6057ec0438';
  private clientSecret = 'c7757feb5518452cafe80565af400216';
  private refreshToken = 'AQC9oH-UuUUDtAsHJ1NBsvmWb634P8eFEFRT6i86SkTDNme8MSTV3g4gT-SJJVCbq-8xoja2TLbw5G0rntYZnFBFYElIwmVTU4MT3c8NLFNTmy1SDa3DmGkAc-G7aRc9yeg';
  private spotifyUserId = ''; // Will be fetched dynamically
  private backupPlaylistId = '37i9dQZF1DX76Wlfdnj7AP'; // Change this to your real backup playlist ID

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

  async createPlaylist(playlistName: string, selectedSongs: any[]): Promise<any> {
    if (!this.spotifyUserId) {
      console.error('Spotify User ID not available');
      return;
    }
  
    // 1️⃣ Clean old playlists before creating a new one
    await this.deleteOldPlaylists();
  
    // 2️⃣ Get a new access token
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
  
    // 3️⃣ Create the playlist
    const playlistResponse = await this.http.post<any>(url, body, { headers }).toPromise();
    const playlistId = playlistResponse?.id;
    if (!playlistId) {
      throw new Error('Failed to create playlist');
    }
  
    console.log(`Playlist Created: ${playlistId}`);
  
    // 4️⃣ Calculate total duration of selected songs
    let totalDuration = selectedSongs.reduce((sum, song) => sum + song.duration_ms, 0) / 1000; // Convert to seconds
    console.log(`Total selected songs duration: ${totalDuration} seconds`);
  
    // 5️⃣ If total duration is less than 1 hour, get extra songs
    if (totalDuration < 3600) {
      console.log("Playlist is too short, adding backup songs...");
      const backupSongs = await this.getBackupSongs(this.backupPlaylistId, 3600 - totalDuration);
      selectedSongs = [...selectedSongs, ...backupSongs]; // Merge both lists
    }
  
    // 6️⃣ Get track URIs for Spotify API
    const songUris = selectedSongs.map(song => `spotify:track:${song.id}`);
  
    // 7️⃣ Add songs to playlist
    await this.addSongsToPlaylist(playlistId, songUris);
  
    console.log(`Playlist "${playlistName}" created successfully with ${selectedSongs.length} songs!`);
    return playlistId;
  }
  
  async getBackupSongs(backupPlaylistId: string, remainingTime: number): Promise<any[]> {
    const token = await this.getSpotifyToken();
    const url = `https://api.spotify.com/v1/playlists/${backupPlaylistId}/tracks`;
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    try {
      const response = await this.http.get<any>(url, { headers }).toPromise();
      const backupSongs = response.items.map((item: {track: any}) => item.track); // Extract track data
  
      let addedTime = 0;
      const selectedBackupSongs: any[] = [];
  
      // Select songs until we reach the required duration
      for (const song of backupSongs) {
        if (addedTime >= remainingTime) break;
        selectedBackupSongs.push(song);
        addedTime += song.duration_ms / 1000; // Convert to seconds
      }
  
      console.log(`Added ${selectedBackupSongs.length} backup songs (${addedTime} seconds).`);
      return selectedBackupSongs;
    } catch (error) {
      console.error('Error fetching backup songs:', error);
      return [];
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
  
    try {
      await this.http.post(url, body, { headers }).toPromise();
      console.log(`Added ${songUris.length} songs to playlist.`);
    } catch (error) {
      console.error('Error adding songs to playlist:', error);
    }
  }
  


  async getUserPlaylist(): Promise<any[]> {
    const token = await this.getSpotifyToken();
    const url = 'https://api.spotify.com/v1/me/playlists';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    try {
      const response = await this.http.get<any>(url, {headers}).toPromise();
      return response.items || [];
    } catch(error) {
      console.error('Error fetching user playlists:', error);
      return [];
    }
  }

  async deleteOldPlaylists() {
    const playlists = await this.getUserPlaylist();
    const thresholdDate = new Date();
    console.log("playlist:", playlists)
    thresholdDate.setDate(thresholdDate.getDate() - 7);

    for (const playlist of playlists) {
      if (playlist.name.startsWith('Training -')) {
        const createdAt = new Date(playlist.name.split(' - ')[1]);
        if (createdAt < thresholdDate) {
          console.log(`Deleting old playlist: ${playlist.name}`);
          await this.deletePlaylist(playlist.id);
        }
      }
    }
  }

  async deletePlaylist(playlistId: string){
    const token = await this.getSpotifyToken();
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/followers`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    try {
      await this.http.delete(url, {headers}).toPromise();
      console.log(`Playlist ${playlistId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting playlist ${playlistId}`, error);
    }
  }

}
