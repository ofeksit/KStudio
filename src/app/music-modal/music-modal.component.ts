import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SpotifyService } from '../services/spotify.service';
import { AuthService  } from '../services/auth.service';

@Component({
  selector: 'app-music-modal',
  templateUrl: './music-modal.component.html',
  styleUrls: ['./music-modal.component.scss'],
})
export class MusicModalComponent implements OnInit {
  @Input() training: any;
  searchQuery: string = '';
  searchResults: any[] = [];
  selectedSongs: any[] = [];
  userId: string | null = '';


  constructor(private modalCtrl: ModalController, private spotifyService: SpotifyService, private authService: AuthService) {
    this.userId = this.authService.getUserID();
  }


  ngOnInit(): void {
     this.loadTrainingSongs();
  }

  loadTrainingSongs() {
    this.spotifyService.getSongsForTraining(this.training.id).subscribe((songs) => {
      console.log("trainingID", this.training.id);
      this.selectedSongs = songs;
      console.log("songs:", songs);
    });
  }


  async searchSongs() {
    if (!this.searchQuery.trim()) return;
    this.spotifyService.searchSongs(this.searchQuery).then((results) => {
      this.searchResults = results;
    });
  }

  addSong(song: any) {
    this.spotifyService.addSongToTraining(this.training.id, this.userId, song).subscribe(
      (response) => {
        console.log('Song added:', response);
        this.loadTrainingSongs(); // Refresh song list
      },
      (error) => {
        console.error('Error adding song:', error);
      }
    );
  }

  removeSong(song: any) {
    this.spotifyService.removeSongFromTraining(this.training.id, this.userId, song.song_id).subscribe(
      (response) => {
        console.log('Song removed:', response);
        this.loadTrainingSongs(); // Refresh song list
      },
      (error) => {
        console.error('Error removing song:', error);
      }
    );
  }

  saveSelection() {
    this.modalCtrl.dismiss(this.selectedSongs);
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
