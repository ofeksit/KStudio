import { Component, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, NgZone   } from '@angular/core';
import { GestureController, ModalController, ActionSheetController } from '@ionic/angular';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { Booking } from '../Models/booking';
import { ToastController } from '@ionic/angular';
import { AmeliaService } from '../services/amelia-api.service';
import { EditNoteComponent } from '../edit-note/edit-note.component';
import * as moment from 'moment';
import { Md5 } from 'ts-md5';

interface Note {
  id: number;
  userID: string | null;
  title: string;
  content: string;
  color: string;
  dragX?: any;
  opacity?: any;
}

@Component({
  selector: 'app-profile-popup',
  templateUrl: './profile-popup.component.html',
  styleUrls: ['./profile-popup.component.scss'],
})
export class ProfilePopupComponent implements AfterViewInit {
  @ViewChild('popup') popup!: ElementRef;
  

  //#region userVariables
  userName: string | null;  // Fetched dynamically
  userRole: string | null = '';  // Fetched dynamically
  userPhoto: string = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';  // Placeholder for avatar image
  userEmail: string | null = '';
  userID: string | null = '';
  customerID: string | null = '';
  //#endregion

  //#region Trainings/Purchases Variables
  knownTrainingTypes: string[] = [ 'פילאטיס', 'יוגה', 'אימון כוח', 'Parallel 15', 'Spinning', 'TRX', 'Booty&ABS', 'All In', 'HiiT', 'POWER', '' ]; // Array of known training types
  nextRenewalDate?: string;  // Subscription specific
  slotsLeft?: number;  // Amelia package specific
  selectedTab: string = 'trainings';  // Default selected tab
  isLoading: boolean = true; // Set loading to true initially
  errorMessage: string = '';
  trainingsByDay: any;
  availabilityFilter: string = '';
  showDropdown: boolean = false;
  selectedType: string = '';
  userAppointments: Booking[] = [];
  filteredAppointments: Booking[] = [];
  unfilteredAppointments: Booking[] = [];
  userPurchases: any[] = [];
  gravatarUrl: string = '';
  locationEnabled = false; // Track the toggle state
  favLocation: string | null = "";
  selectedLocation: string = ""; // Default location
  isLoadingSubscriptionData = false;
  //#endregion

  //#region NotesVariables
  userNotes: Note[] = []; // Array to store user notes
  colors = ['#D1FAE5', '#E5E7EB', '#FCE7F3', '#FEF3C7', '#CFFAFE', '#FCE7F3'];
  showUndoToast = false;
  deletedNote: Note | null = null;
  deletedNoteIndex: number | null = null;
  undoTimeout: any;
  // Define the button structure
  undoButton = [{
    text: 'בטל',
    handler: () => this.undoDelete()
  }];
  selectedNote: Note | null = null;
  isEditModalOpen: boolean = false;

  // Temporary variables for two-way binding
  editTitle: string = '';
  editContent: string = '';
  editColor: string = '';
  //#endregion
  
  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private profileService: ProfileService,
    private authService: AuthService,
    private toastController: ToastController,
    private ameliaService: AmeliaService,
    private gestureCtrl: GestureController,
    private editNoteModalCtrl: ModalController,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.userName = this.authService.getUserFullName();    
    this.userRole = this.translateUserRole(this.authService.getUserRole());
    this.customerID = this.authService.getCustomerID();
    this.userID = this.authService.getUserID();
    this.userEmail = this.authService.getUserEmail();
    
    this.setGravatarUrl();

    this.authService.fetchUserFavLocation().subscribe({
      next: (response) => {
        this.favLocation = response.favorite_location;
        this.selectedLocation = response.favorite_location;
      },
      error: (error) => {
        console.error("Error fetching user fav location", error);
      }
    })
  } 

  setGravatarUrl(){
    if (this.userEmail){
      const hash = Md5.hashStr(this.userEmail.trim().toLowerCase());
      this.gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
    }
  }

  // Method to format the date from dd/mm/yyyy to dd.mm.yyyy
  formatDate(dateString: string): string {
    return dateString.replace(/\//g, '.');  // Replace all slashes with dots
  }
    
    
  async ngOnInit() {
    this.isLoadingSubscriptionData = false;
    this.profileService.fetchSubscriptionData(this.userID, this.customerID).subscribe(
      ({ subscriptionId, expiryDate, availableSlots }) => {
          this.nextRenewalDate = this.formatDate(expiryDate);
          this.slotsLeft = availableSlots;
          this.isLoadingSubscriptionData = true;
      },
      (error) => {
          console.error('Error fetching subscription data:', error);
          this.slotsLeft = 0;
          this.nextRenewalDate = '';
          this.isLoadingSubscriptionData = true;
      }
  );
  
    //Fetching Notes For Specific User
    this.fetchNotes();

    this.trainingsByDay = this.ameliaService.getTrainingsTitles();
    //this.profileService.getUserPackageCustomerID(); - SHOULD CHECK IF WORKS WITHOUT IT, FETCHING USER PACKAGECUSTOMERID
    
    // Check if the titles have already been fetched
    if (!this.trainingsByDay || Object.keys(this.trainingsByDay).every(key => this.trainingsByDay[key].length === 0)) {
      // Fetch the training titles if not already available
      await this.ameliaService.fetchTitleTrainings();
      this.trainingsByDay = this.ameliaService.getTrainingsTitles();
    }

    // Load the last saved filter choice from local storage (if exists)
    const savedFilter = localStorage.getItem('userFilterChoice');
    if (savedFilter) {
      this.availabilityFilter = savedFilter;
    }
    this.authService.fetchUserRole().subscribe(data => {this.authService.storeUserRole(data.roles[0]); this.userRole = this.translateUserRole(data.roles[0]);});
    this.loadUserAppointmentsLast60Days();
    // Apply the filter after loading appointments
    this.updateFilteredAppointments();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, // Duration in milliseconds
      color: color,
      position: 'bottom',
    });
    await toast.present(); // Make sure the toast is presented
  }

  loadUserAppointmentsLast60Days() {
    this.isLoading = true;
    this.profileService.getLast60DaysAppointmentsForUser().subscribe(async (appointments: any[]) => {
      const promises: Promise<any>[] = [];
      
      for (const appointment of appointments) {
        const booking = appointment.matchedBooking;
        const status = appointment.userBookingStatus;
  
        if (booking) {
          appointment.userBookingStatus = status;
          const bookingDate = moment(appointment.bookingStart).format('YYYY-MM-DD');
          const bookingTime = moment(appointment.bookingStart).format('HH:mm');
  
          const promise = this.getAppointmentTitleByDateTime(bookingDate, bookingTime)
            .then((title: string) => {
              appointment.title = title || 'כללי';  // Set the title or fallback to 'כללי'
            })
            .catch((error) => {
              console.error('Error fetching appointment title:', error);
              appointment.title = 'כללי';  // Fallback title in case of error
            });
  
          promises.push(promise);
        }
      }
  
      await Promise.all(promises);
      // Sort the appointments by the bookingStart datetime in descending order.
      this.userAppointments = appointments.sort((a, b) => moment(b.bookingStart).diff(moment(a.bookingStart)));
      this.filteredAppointments = [...this.userAppointments];
  
      this.updateFilteredAppointments();
  
      this.isLoading = false;
    }, error => {
      this.isLoading = false;  // Handle error
      console.error('Error loading appointments:', error);
    });
}

  getDayFromDate(dateString: string): string {
        // Parse the date in DD/MM/YYYY format using Moment.js
    const date = moment(dateString, "DD/MM/YYYY").toDate();
    // Array of day names
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Get the day of the week (0-6)
    const dayIndex = date.getDay();
    // Return the corresponding day name
    return daysOfWeek[dayIndex];
  }


  // Your original function modified to use the initialized data
  async getAppointmentTitleByDateTime(date: string, time: string): Promise<string> {
    const formattedDate = moment(date, "YYYY-MM-DD").format('DD/MM/YYYY');
    const day = this.getDayFromDate(formattedDate);

    // Check if the day exists in trainingsByDay
    if (this.trainingsByDay[day]) {
      // Find the training by matching the time
      const training = this.trainingsByDay[day].find((t: { time: string; }) => t.time === time);      
      // Return the title if found, or null if no match
      if (training) {
        return training.title;
      }
    }
    return 'כללי'; // Return null if no match found
  }
  
  //Fetch user role to hebrew description
  translateUserRole (role: string | null): string {
    if (role === 'author')
      return 'מתאמנת';
    else if (role === 'administrator')
      return 'מנהל';
    else if (role === 'activesubscription')
      return 'מנוי פעיל';
    else if (role === 'trainer')
      return 'מאמן';
    else if (role === 'team')
      return 'צוות';
    else if (role === 'trial-users')
      return 'מתאמנת ניסיון';
    else if (role === 'inactive')
      return 'לא פעילה';
    else if (role === 'shalom-trainer')
      return 'מאמן שלום עליכם';
    else if (role === 'personal')
      return 'מתאמנת אישית';
    return '';
  }

  ngAfterViewInit() {
  // Wait until the DOM is fully rendered
  const scrollElements = document.querySelectorAll('.scroll-y');

  scrollElements.forEach((scrollElement) => {
    if (scrollElement instanceof HTMLElement) {
      // Override the overflow-y style dynamically
      scrollElement.style.overflowY = 'hidden';
    }
  });
  }

  closePopup() {
    this.modalCtrl.dismiss();
  }

  async showActions(training: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'פעולות',
      buttons: [
        {
          text: 'ביטול אימון',
          role: 'destructive',
          icon: 'close-circle-outline',
          handler: () => {
            this.cancelBooking(training.matchedBooking.id);
          },
        },
        {
          text: 'סגור',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  downloadInvoice(order: any) {
    if (order.invoice_link) {
      window.open(order.invoice_link, '_blank'); // Opens the invoice link in a new tab
    } else {
      console.error('No invoice link available for this order.');
      this.errorMessage = "לא ניתן להפיק חשבונית בעבור הזמנה זו."
      this.presentToast(this.errorMessage, 'danger');
    }
  }

  // Get status icons for trainings
  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'checkmark-circle-outline';
      case 'canceled':
        return 'close-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      case 'pending':
        return 'time-outline';
      case 'refunded':
        return 'cash-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      default:
        return 'alert-circle-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'completed':
        return 'success';
      case 'canceled':
        return 'danger';
      case 'cancelled':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'warning';
      default:
        return 'medium';
    }
  }

  cancelBooking(bookingId: string) {
    this.profileService.cancelBooking(bookingId).subscribe(
      (data: any) => {
        if (data.data.cancelBookingUnavailable)
        {
          this.errorMessage = 'לא ניתן לבטל אימון זה'
          this.presentToast(this.errorMessage, 'danger');
        }
        else {
          this.errorMessage = 'האימון בוטל בהצלחה'
          this.presentToast(this.errorMessage, 'success');
        }
      },
      (error) => {
        this.errorMessage = 'לא ניתן לבטל אימון זה, אנא נסה שנית'
        this.presentToast(this.errorMessage, 'danger');
        console.error('Error occurred while canceling the booking', error);
      }
    );
  }

  loadUserPurchases() {
  this.profileService.fetchUserPurchases(this.userID).subscribe((purchases: any[]) => {
    this.userPurchases = purchases;
  });
  }

  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
    
    if (this.selectedTab == 'purchases')
      this.loadUserPurchases();
  }

  // Toggle dropdown visibility
  toggleFilterDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // Call this method when availability or type filters change
  onFilterChange() {
    this.updateFilteredAppointments();
    // Save the current filter choice to local storage
    localStorage.setItem('userFilterChoice', this.availabilityFilter);
  }

  updateFilteredAppointments() {
    let tempAppointments = [...this.userAppointments];  // Ensure you are working with a copy
       
    // Filter by availability filter (approved, cancelled, or all)
    if (this.availabilityFilter === 'approved') {
      tempAppointments = tempAppointments.filter(appointment => appointment.userBookingStatus === 'approved');
    } else if (this.availabilityFilter === 'cancelled') {
      tempAppointments = tempAppointments.filter(appointment => appointment.userBookingStatus === 'canceled');
    } 
    // If 'all' is selected, no filtering is needed
  
    // Update the displayed filtered list
    this.filteredAppointments = tempAppointments;
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }

  updateFavLocation(location: string) {
    this.favLocation = location;
    this.selectedLocation = location;
    this.profileService.updateFavoriteLocation(location).subscribe(
      (error) => {
      });
  }

  //#region NotesFunctions
  // Fetch notes for user
  fetchNotes() {
    this.profileService.getNotesByUser(this.userID).subscribe(response => {
      if (response.success) {
        this.userNotes = response.notes;
      }
    });
  }

  // Add a new note
  addNote() {
    const newColor = this.getRandomColor();
    this.profileService.addNote(this.userID, 'New Note', 'Click to edit...', newColor).subscribe(response => {
      if (response.success) {
        this.userNotes.push({
          id: response.note_id,
          userID: this.userID,
          title: 'New Note',
          content: 'Click to edit...',
          color: newColor
        });
      }
    });
    
  }
  
  // Utility function to pick a random color
  getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  trackByNoteId(index: number, note: any): number {
    return note.id; // Ensure this is unique for each note
  }
  
  // Remove a note
  removeNote(noteId: number) {
    const index = this.userNotes.findIndex(note => note.id === noteId);
    if (index === -1) return;
  
    this.deletedNote = { ...this.userNotes[index] }; // Store deleted note copy
    this.deletedNoteIndex = index;
    this.userNotes.splice(index, 1); // Remove note from UI
  
    this.showUndoToast = true; // Show undo option
  
    console.log("Note deleted, waiting for undo...");
  
    this.undoTimeout = setTimeout(() => {
      this.finalizeDelete(noteId);
    }, 5000);
  }

  
  
  // Edit a note
  editNote(note: Note) {
    this.profileService.editNote(note.id, note.title, note.content, note.color).subscribe(response => {
      if (response.success) {
        console.log('Note updated successfully');
      }
    });
  }


  private touchStartX: number = 0;
  private threshold: number = 100; // Minimum swipe distance to delete
  private maxSwipeDistance: number = window.innerWidth * 0.4; // 40% of screen width
    

  onTouchStart(event: TouchEvent, noteId: number) {
    this.touchStartX = event.touches[0].clientX;
    const note = this.userNotes.find(n => n.id === noteId);
    if (note) {
      note.dragX = 0;  // Reset dragging position
      note.opacity = 1; // Reset opacity
    }
  }

  onTouchMove(event: TouchEvent, noteId: number) {
    const currentX = event.touches[0].clientX;
    const diffX = currentX - this.touchStartX;
  
    const note = this.userNotes.find(n => n.id === noteId);
    if (note) {
      note.dragX = diffX; // Move the note with the swipe
      note.opacity = Math.max(0.4, 1 - Math.abs(diffX) / this.maxSwipeDistance); // Reduce opacity as it moves
    }
  }

  onTouchEnd(noteId: number) {
    const note = this.userNotes.find(n => n.id === noteId);
    if (!note) return;
  
    if (Math.abs(note.dragX) > this.threshold) {
      this.animateNoteDeletion(noteId, note.dragX > 0 ? window.innerWidth : -window.innerWidth);
    } else {
      this.resetNotePosition(note);
    }
  }

  private animateNoteDeletion(noteId: number, targetX: number) {
    const note = this.userNotes.find(n => n.id === noteId);
    if (!note) return;
  
    note.dragX = targetX; // Move it off the screen
    note.opacity = 0; // Fade out
  
    setTimeout(() => {
      this.removeNote(noteId);
    }, 300);
  }
   
  private resetNotePosition(note: any) {
    note.dragX = 0;
    note.opacity = 1;
  }

  undoDelete() {
    if (this.deletedNote !== null && this.deletedNoteIndex !== null) {
      console.log("Undoing delete...");
  
      // Reset opacity and dragX for the deleted note
      this.deletedNote.opacity = 1; // Reset opacity to fully visible
      this.deletedNote.dragX = 0;   // Reset dragX to 0 (no horizontal translation)
  
      // Reinsert the deleted note back into the array
      this.userNotes.splice(this.deletedNoteIndex, 0, this.deletedNote);
  
      console.log("Updated userNotes:", this.userNotes); // Debugging line
  
      // Reset state
      this.deletedNote = null;
      this.deletedNoteIndex = null;
      this.showUndoToast = false;
      clearTimeout(this.undoTimeout);
  
      // Force Angular to detect changes
      this.cdRef.detectChanges();
    }
  }

  finalizeDelete(noteId: number | null | undefined) {
    if (!noteId) {
      this.showUndoToast = false;
      return;
    }
  
    this.showUndoToast = false;
    this.deletedNote = null;
    this.deletedNoteIndex = null;
  
    this.profileService.removeNote(noteId).subscribe(response => {
      console.log("Note permanently deleted from server", response);
    });
  }
  
  async openEditPopup(note: Note) {
    if (!note) return;
  
    this.selectedNote = { ...note };
    this.editTitle = note.title;
    this.editContent = note.content;
    this.editColor = note.color;
  
    console.log("Opening Edit Modal for Note:", this.selectedNote);
  
    const modal = await this.editNoteModalCtrl.create({
      component: EditNoteComponent,
      componentProps: {
        title: this.editTitle,
        content: this.editContent,
        color: this.editColor,
        onSave: (newTitle: string, newContent: string, newColor: string) => {
          this.saveNoteChanges(newTitle, newContent, newColor);
        }
      }
    });
  
    return await modal.present();
  }
  
  
  saveNoteChanges(newTitle: string, newContent: string, newColor: string) {
    if (!this.selectedNote) return;
  
    console.log("Saving Note Changes:", this.selectedNote.id, newTitle, newContent, newColor);
  
    this.profileService.editNote(
      this.selectedNote.id,
      newTitle,
      newContent,
      newColor
    ).subscribe(response => {
      if (response.success) {
        const index = this.userNotes.findIndex(n => n.id === this.selectedNote!.id);
        if (index !== -1) {
          this.userNotes[index] = {
            ...this.selectedNote!,
            title: newTitle,
            content: newContent,
            color: newColor
          };
        }
        console.log("Note Updated Successfully");
      }
    });

  }
//#endregion Notes Functions
}
