import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController, AnimationController  } from '@ionic/angular';
import { SpotifyService } from '../services/spotify.service';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-music-modal',
  templateUrl: './music-modal.component.html',
  styleUrls: ['./music-modal.component.scss'],
  animations: [
    trigger('songListAnimation', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ]),
      transition(':leave', [
        query(':leave', [
          animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-100%)' }))
        ], { optional: true })
      ])
    ])
  ]
})
export class MusicModalComponent implements OnInit {
  @Input() training: any;
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;
  @ViewChild('selectedSongsList', { static: false }) selectedSongsList!: ElementRef;

  searchQuery: string = '';
  searchResults: any[] = [];
  selectedSongs: any[] = [];
  userId: string | null = '';
  userRole: string | null = '';
  errorMessage: string = '';
  isSearching: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private spotifyService: SpotifyService,
    private authService: AuthService,
    private toastController: ToastController,
    private animationCtrl: AnimationController
  ) {
    this.userId = this.authService.getUserID();
    this.userRole = this.authService.getUserRole();
  }

  ngOnInit(): void {
    this.loadTrainingSongs();
  }

  async searchSongs() {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }
    
    this.isSearching = true;
    try {
      this.searchResults = await this.spotifyService.searchSongs(this.searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      this.presentToast('Failed to search songs', 'danger');
    } finally {
      this.isSearching = false;
    }
  }

  addSong(song: any) {
    const newSong = {
      song_id: song.id,
      song_name: song.name,
      artist_name: song.artists[0]?.name || 'Unknown Artist',
      artist_image: song.album?.images[0]?.url || 'assets/default-artist.png',
      user_id: this.userId,
      isNew: true, // Mark as new for animation
      isFadingOut: false // Ensure it's not in fade-out mode
    };
  
    // Check if the song is already in the list to prevent duplicates
    if (!this.selectedSongs.some(s => s.song_id === newSong.song_id)) {
      this.selectedSongs.push(newSong); // Add song instantly
    }
  
    // Perform API request in the background
    this.spotifyService.addSongToTraining(this.training.id, this.userId, song).subscribe(
      () => {
        //this.presentToast('Song added successfully', 'success');
      },
      (error) => {
        console.error('Error adding song:', error);
        this.presentToast('Failed to add song', 'danger');
      }
    );
  
    // Hide search results and reset search bar
    this.clearSearch();
    this.animateAddSong();
  }
  
  

  removeSong(song: any) {
    // Find the index of the song in the list
    const songIndex = this.selectedSongs.findIndex(s => s.song_id === song.song_id);
    if (songIndex !== -1) {
      // Mark the song as fading out
      this.selectedSongs[songIndex].isFadingOut = true;
  
      setTimeout(() => {
        // Remove from UI after animation completes
        this.selectedSongs = this.selectedSongs.filter(s => s.song_id !== song.song_id);
  
        // Perform API request in the background
        this.spotifyService.removeSongFromTraining(this.training.id, this.userId, song.song_id).subscribe(
          () => {
            //this.presentToast('Song removed successfully', 'success');
          },
          (error) => {
            console.error('Error removing song:', error);
            this.presentToast('Failed to remove song', 'danger');
          }
        );
      }, 300); // Matches fade-out animation duration
    }
  }

  animateAddSong() {
    setTimeout(() => {
      if (this.selectedSongsList) {
        const animation = this.animationCtrl.create()
          .addElement(this.selectedSongsList.nativeElement)
          .duration(300)
          .fromTo('opacity', '0.5', '1')
          .fromTo('transform', 'scale(0.95)', 'scale(1)');
          
        animation.play();
      }
    }, 50);
  }
  

  loadTrainingSongs() {
    this.spotifyService.getSongsForTraining(this.training.id).subscribe(
      (songs) => {
        this.selectedSongs = songs.map(song => ({
          ...song,
          artist_image: song.artist_image || 'assets/default-artist.png'
        }));
      },
      (error) => {
        console.error('Error fetching songs:', error);
        this.presentToast('Failed to load songs', 'danger');
      }
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
      this.searchInput.nativeElement.blur();
    }
  }

  isAddedToSelectedSongs(song: any): boolean {
    return this.selectedSongs.some((s) => s.song_id === song.id);
  }

  getTotalDuration(): string {
    const totalSeconds = this.selectedSongs.reduce((total, song) => total + song.duration_ms / 1000, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  saveSelection() {
    this.modalCtrl.dismiss(this.selectedSongs);
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  async createSpotifyPlaylist() {
    if (!this.selectedSongs.length) {
      this.presentToast('No songs in the playlist!', 'danger');
      return;
    }
    const playlistName = `Training - ${this.training.start_time}`;
  
    try {
      // Step 1: Create Playlist (Fix: Pass `this.selectedSongs`)
      const playlistResponse = await this.spotifyService.createPlaylist(playlistName, this.selectedSongs);
      console.log("playlistResponse:", playlistResponse.id);
      const playlistId = playlistResponse.id;
  
      // Step 2: Get URIs of Selected Songs
      const songUris = this.selectedSongs.map(song => `spotify:track:${song.song_id}`);
  
      // Step 3: Add Songs to Playlist
      await this.spotifyService.addSongsToPlaylist(playlistId, songUris);
  
      this.presentToast(`הפלייליסט נוצר בהצלחה!`, 'success');
    } catch (error) {
      console.error('Error creating playlist:', error);
      this.presentToast('Failed to create playlist', 'danger');
    }
  }
  
}