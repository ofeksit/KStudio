import { Component, Input, OnInit, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { ModalController, GestureController } from '@ionic/angular';
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
  
  @ViewChild('modalContainer', { read: ElementRef }) modalContainer!: ElementRef;

  private startX: number = 0;
  private currentX: number = 0;
  private threshold: number = 100; // How far to swipe before closing


  constructor(private renderer: Renderer2, private gestureController: GestureController, private modalCtrl: ModalController, private spotifyService: SpotifyService, private authService: AuthService) {
    this.userId = this.authService.getUserID();
  }


  ngOnInit(): void {
     this.loadTrainingSongs();
  }

  ionViewDidEnter() {
    this.setupSwipeGesture();
  }

  setupSwipeGesture() {
    const gesture = this.gestureController.create({
      el: this.modalContainer.nativeElement,
      gestureName: 'swipe-to-close',
      threshold: 10,
      direction: 'x',
      onStart: (event) => {
        this.startX = event.startX;
      },
      onMove: (event) => {
        this.currentX = event.deltaX;

        // Move modal based on swipe position (limit max swipe distance)
        if (this.currentX > 0 && this.currentX < 150) {
          const opacity = 1 - this.currentX / 200; // Reduce opacity as user swipes
          const scale = 1 - this.currentX / 800; // Shrink modal slightly
          this.renderer.setStyle(this.modalContainer.nativeElement, 'transform', `translateX(${this.currentX}px) scale(${scale})`);
          this.renderer.setStyle(this.modalContainer.nativeElement, 'opacity', `${opacity}`);
        }
      },
      onEnd: (event) => {
        if (event.deltaX > this.threshold) {
          this.closeModal(); // Close modal if swiped far enough
        } else {
          // Reset modal position if swipe is too short
          this.renderer.setStyle(this.modalContainer.nativeElement, 'transform', 'translateX(0px) scale(1)');
          this.renderer.setStyle(this.modalContainer.nativeElement, 'opacity', '1');
          this.renderer.setStyle(this.modalContainer.nativeElement, 'transition', 'transform 0.3s ease-out, opacity 0.3s ease-out');
          setTimeout(() => {
            this.renderer.removeStyle(this.modalContainer.nativeElement, 'transition');
          }, 300);
        }
      }
    });
    gesture.enable(true);
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
    // 🔥 Apply a fade-out and scale-down animation instead of top-bottom
    this.renderer.setStyle(this.modalContainer.nativeElement, 'transform', 'translateX(50px) scale(0.9)');
    this.renderer.setStyle(this.modalContainer.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.modalContainer.nativeElement, 'transition', 'transform 0.3s ease-out, opacity 0.3s ease-out');

    setTimeout(() => {
      this.modalCtrl.dismiss();
    }, 300); // Wait for animation to complete
  }
}
