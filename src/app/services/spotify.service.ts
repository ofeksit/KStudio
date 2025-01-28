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
    
    // ✅ Ensure songs have valid duration
    const results = data.tracks?.items || [];
    const filteredResults = results.filter((song: { id: string; duration_ms: number }) => 
      song && song.duration_ms && !isNaN(song.duration_ms)
    );
    
  
    //console.log("🔍 Search Results (With Duration):", filteredResults);
  
    return filteredResults;
  }  

  //#endregion


  getSongsForTraining(trainingId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-songs/?training_id=${trainingId}`);
  }

  addSongToTraining(trainingId: number, userId: string | null, song: any): Observable<any> {
    //console.log("Song being added with duration:", song.duration_ms); // Add this line
    const body = {
      training_id: trainingId,
      user_id: userId,
      song_id: song.id,
      song_name: song.name,
      artist_name: song.artists[0]?.name || 'UNKNOWN',
      artist_image: song.album?.images[0]?.url || 'UNKNOWN',
      duration_ms: song.duration_ms,
    };
    
    //console.log("Body being sent to API:", body); // Add this line
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

  async createPlaylist(playlistName: string, selectedSongs: any[]): Promise<string | null> {
    if (!this.spotifyUserId) {
      console.error('❌ Spotify User ID not available');
      throw new Error('Spotify User ID not available');
    }
  
    await this.deleteOldPlaylists(); // Delete old playlists before creating a new one

    // Debug log to check selected songs structure
    /*console.log('Selected songs before duration calculation:', 
      selectedSongs.map(song => ({
        name: song.song_name,
        duration: song.duration_ms / 1000,
        id: song.song_id || song.id
      }))
    );*/
  
    // Calculate total duration with better error handling
    const totalDuration = selectedSongs.reduce((sum, song) => {
      // Check both possible duration field names
      const duration = song.duration_ms || song?.duration || 0;
      
      // Convert to number if it's a string
      const durationMs = typeof duration === 'string' ? parseInt(duration) : duration;
      
      if (isNaN(durationMs)) {
        console.warn(`⚠️ Invalid duration for song: ${song.song_name || 'Unknown'}:`, duration);
        return sum;
      }
      
      const durationSecs = durationMs / 1000;
      //console.log(`Song: ${song.song_name}, Duration: ${durationSecs} seconds`);
      return sum + durationSecs;
    }, 0);
  
    //console.log(`🎵 Total initial playlist duration: ${totalDuration} seconds`);
  
    const token = await this.getSpotifyToken();
    const url = `https://api.spotify.com/v1/users/${this.spotifyUserId}/playlists`;
  
    try {
      const playlistResponse = await this.http.post<any>(url, {
        name: playlistName,
        description: 'Training Playlist',
        public: false,
      }, { 
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        })
      }).toPromise();
      
      if (!playlistResponse?.id) {
        console.error('❌ Failed to create playlist: No ID returned');
        return null;
      }
  
      const playlistId = playlistResponse.id;
      //console.log(`✅ Playlist Created: ${playlistId}`);
  
      let finalSongs = [...selectedSongs];
  
      if (totalDuration < 3600) {
        const remainingTime = 3600 - totalDuration;
        //console.log(`⚠️ Playlist is ${remainingTime} seconds short, adding backup songs...`);
        const backupSongs = await this.getBackupSongs(remainingTime);
        finalSongs = [...selectedSongs, ...backupSongs];
      }
  
      // Prepare song URIs with logging
      const songUris = finalSongs
        .map(song => {
          const songId = song.song_id || song.id;
          if (!songId) {
            console.warn(`⚠️ Missing song ID for: ${song.song_name || 'Unknown song'}`);
            return null;
          }
          return `spotify:track:${songId}`;
        })
        .filter((uri): uri is string => uri !== null);
  
      if (songUris.length === 0) {
        console.error("❌ No valid songs to add. Aborting playlist creation.");
        return null;
      }
  
      await this.addSongsToPlaylist(playlistId, songUris);
      //console.log(`✅ Playlist created with ${songUris.length} songs!`);
      return playlistId;
    } catch (error) {
      console.error("❌ Error creating playlist:", error);
      return null;
    }
  }
    
  async getBackupSongs(remainingTime: number): Promise<any[]> {
    const token = await this.getSpotifyToken();
    const playlistsUrl = `https://api.spotify.com/v1/me/playlists`;
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    try {
      // Step 1: Fetch all user playlists
      const playlistsResponse = await this.http.get<any>(playlistsUrl, { headers }).toPromise();
  
      if (!playlistsResponse || !playlistsResponse.items) {
        console.error("Error: Unable to fetch user playlists.", playlistsResponse);
        return [];
      }
  
      //console.log("Retrieved playlists:", playlistsResponse.items.map((p: { name: string }) => p.name));

  
      // Step 2: Find a playlist with "backup" in its name (case insensitive)
      const backupPlaylist = playlistsResponse.items.find((playlist: any) =>
        playlist.name.toLowerCase().includes("backup")
      );
  
      if (!backupPlaylist) {
        console.error("❌ Error: No backup playlist found.");
        return [];
      }
  
      const backupPlaylistId = backupPlaylist.id;
      //console.log(`✅ Found backup playlist: ${backupPlaylist.name} (ID: ${backupPlaylistId})`);
  
      // Step 3: Fetch songs from the backup playlist
      const tracksUrl = `https://api.spotify.com/v1/playlists/${backupPlaylistId}/tracks`;
      const tracksResponse = await this.http.get<any>(tracksUrl, { headers }).toPromise();
  
      if (!tracksResponse || !tracksResponse.items) {
        console.error("❌ Error: No tracks found in backup playlist.");
        return [];
      }
  
      let backupSongs = tracksResponse.items.map((item: any) => item.track);
  
      // ✅ Filter out invalid songs
      backupSongs = backupSongs.filter((song: { id: string; duration_ms: number }) => 
        song && song.id && song.duration_ms && !isNaN(song.duration_ms)
      );
      
  
      let addedTime = 0;
      const selectedBackupSongs: any[] = [];
  
      for (const song of backupSongs) {
          if (addedTime + (song.duration_ms / 1000) > remainingTime) break;
          selectedBackupSongs.push(song);
          addedTime += song.duration_ms / 1000; // Convert to seconds
      }
  
      //console.log(`✅ Added ${selectedBackupSongs.length} backup songs (${addedTime} seconds).`);
      return selectedBackupSongs;
    } catch (error) {
      console.error("❌ Error fetching backup songs:", error);
      return [];
    }
  }
  
  async addSongsToPlaylist(playlistId: string, songUris: string[]): Promise<void> {
    if (!playlistId || playlistId === 'undefined') {
      console.error("❌ Invalid playlist ID:", playlistId);
      return;
    }
  
    if (!songUris.length) {
      console.error("❌ No songs to add.");
      return;
    }
  
    const token = await this.getSpotifyToken();
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  
    const body = {
      uris: songUris.filter(uri => uri.startsWith("spotify:track:")),
    };
  
    if (body.uris.length === 0) {
      console.error("❌ No valid track URIs found. Aborting song addition.");
      return;
    }
  
    try {
      await this.http.post(url, body, { headers }).toPromise();
      //console.log(`✅ Successfully added ${body.uris.length} songs to playlist.`);
    } catch (error) {
      console.error('❌ Error adding songs to playlist:', error);
    }
  }
  
  async getUserPlaylist(): Promise<any[]> {
    const token = await this.getSpotifyToken();
    let url = 'https://api.spotify.com/v1/me/playlists?limit=50&market=US'; // ⬅ Fetch up to 50 playlists per request
  
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  
    let allPlaylists: any[] = [];
    let nextUrl: string | null = url;
  
    try {
      while (nextUrl) {
        let response: any = '';
           response = await this.http
          .get<{ items: any[]; next: string | null }>(nextUrl, { headers })
          .toPromise()
          .catch(() => ({ items: [], next: null })); // ✅ Prevents undefined issues
  
        if (!response || !response.items) {
          console.warn('Spotify API returned an empty response.');
          break;
        }
  
        allPlaylists = allPlaylists.concat(response.items);
        nextUrl = response.next; // Get next page if available
      }
  
      //console.log("Fetched Playlists:", allPlaylists); // 🔍 Debug: Check which playlists are returned
      return allPlaylists;
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      return [];
    }
  }
  
  
  
  
  

  async deleteOldPlaylists() {
    const playlists = await this.getUserPlaylist();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 2);
    //console.log("Playlists:", playlists);
    //console.log("thresoldDate:", thresholdDate)
    for (const playlist of playlists) {
      //console.log("Running check for playlist:", playlist);
      if (playlist.name.startsWith('Training -')) {
        //console.log("Playlists' name matches");
        const createdAt = new Date(playlist.name.split(' - ')[1]);
        //console.log("Playlist created at:", createdAt);
        if (createdAt < thresholdDate) {
          //console.log(`Deleting old playlist: ${playlist.name}`);
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
      //console.log(`Playlist ${playlistId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting playlist ${playlistId}`, error);
    }
  }

}
