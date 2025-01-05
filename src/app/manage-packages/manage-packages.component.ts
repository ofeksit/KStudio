import { Component, OnInit } from '@angular/core';
import { ManagePackagesService } from '../services/manage-packages.service';
import { formatDate } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment'; // Assuming you've installed Moment.js
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AlertController } from '@ionic/angular';


export interface Package {
  customerId: number;
  customerFullName?: string; // Added this field
  packageId: number;
  packageCustomerId: number;
  serviceId: number;
  available: number;
  total: number;
  purchased: string;
}

export interface Subscription {
  id: number;
  status: string;
  renewalDate: string;
}

export interface User {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  wpUserPhotoUrl: string;
}

export interface Appointment {
  id: number;
  date: string;
  time: string;
  status: string;
  customerName: string;
  bookingId: string;
}


@Component({
  selector: 'app-manage-packages',
  templateUrl: './manage-packages.component.html',
  styleUrls: ['./manage-packages.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('void', style({
        height: '0',
        opacity: '0'
      })),
      state('*', style({
        height: '*',
        opacity: '1'
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})

export class ManagePackagesComponent  implements OnInit {

  //User

  //Package

  //Subscriptions

  newTraining = {
    dateTime: '',
    location: 'main',
  };

  // Add subscription data structure
  subscription = {
    id: '',
    status: '',
    nextRenewal: ''
  };
  
  isDatePickerOpen = false; // To toggle the modal
  selectedDate: string = ""; // To store the selected date

  selectedSubscriptionId: string | null = null;
  expandedCards: { [key: number]: boolean } = {};
  
  visibleAppointments: { [key: number]: boolean } = {};

  loadingSubscriptionId: string | null = null;

  today: string = new Date().toISOString();
  minDate = new Date().toISOString(); // Set minimum date to today

  showAddTrainingForm: { [key: number]: boolean } = {};

  availablePackages: Package[] = [];

  appointments: { [packageCustomerId: number]: Appointment[] } = {};

  currentPackageId: number | null = null;
  currentPurchaseDate: string | null = null;


  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  packages: Package[] = [];
  searchQuery: string = '';
  searchSubject: Subject<string> = new Subject<string>();

  constructor(private alertController: AlertController, private http: HttpClient, private managePackagesService: ManagePackagesService) { }

  ngOnInit() {
    this.loadUsers();
    this.setupSearchSubscription();
    this.today = new Date().toISOString();
    this.minDate = new Date().toISOString();
    
    // If newTraining.dateTime isn't already set, initialize it
    if (!this.newTraining.dateTime) {
      this.newTraining.dateTime = this.today;
    }

    if (!this.selectedDate) {
      this.selectedDate = this.today;
    }

  }

  // Add this new method to toggle card expansion
  toggleCard(packageCustomerId: string | number): void {
    this.expandedCards[Number(packageCustomerId)] = !this.expandedCards[Number(packageCustomerId)];
  }

  // Fetch subscription data
  fetchSubscription(userId: string) {
    this.managePackagesService.getSubscriptionDetails(userId).subscribe(
      (data) => {
        const serverData = data[0];
        this.subscription = {
          id: serverData.subscription_id,
          status: serverData.status,
          nextRenewal: serverData.next_renewal_date,
        };
      },
      (error) => {
        console.error("error:", error);
      }
    );
  }

  fetchSubscriptionBySubscriptionID(subscriptionID: string){
    this.managePackagesService.getSubscriptionDetailsBySubscriptionID(subscriptionID).subscribe(
      (data) => {
        console.log("data", data);
        const serverData = data;
        console.log("serverData:", serverData)
        this.subscription = {
          id: serverData.id,
          status: serverData.status,
          nextRenewal: serverData.renewalDate,
        };
      },
      (error) => {
        console.error("Error:", error);
      }
    );
  }

  handleSubscriptionToggle(subscriptionId: string, currentStatus: string) {
    this.loadingSubscriptionId = subscriptionId; // Set loading state for this subscription
    const newStatus = currentStatus === 'active' ? 'suspend' : 'active';
  
    // Call the API
    this.toggleSubscriptionStatus(subscriptionId, newStatus)
      .then(() => {
        // Handle success (e.g., update subscription status locally if needed)
        this.loadingSubscriptionId = null; // Clear loading state
      })
      .catch((error) => {
        console.error('Error toggling subscription:', error);
        // Handle error (e.g., show a toast notification)
        this.loadingSubscriptionId = null; // Clear loading state
      });
  }


  // Toggle subscription status
  toggleSubscriptionStatus(subscriptionID: string, action: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.managePackagesService.updateSubscriptionStatus(subscriptionID, action).subscribe({
        next: (response) => {
          console.log('Status Update Response:', response);
          console.log("subscriptionID:", subscriptionID);
          this.fetchSubscriptionBySubscriptionID(subscriptionID); // Refresh subscription details
          resolve(); // Resolve the Promise on success
        },
        error: (err) => {
          console.error('Error updating subscription status:', err);
          reject(err); // Reject the Promise on error
        }
      });
    });
  }

  openDatePicker(subscriptionId: string) {
    this.selectedSubscriptionId = subscriptionId;
    this.isDatePickerOpen = true;
  }

  closeDatePicker() {
    this.isDatePickerOpen = false;
  }

  async confirmNewDate() {
    this.closeDatePicker(); // Close the modal

    const alert = await this.alertController.create({
      header: 'אישור תאריך חדש',
      message: `האם אתה בטוח שברצונך לעדכן את התאריך ל-${this.selectedDate}?`,
      buttons: [
        {
          text: 'ביטול',
          role: 'cancel'
        },
        {
          text: 'אישור',
          handler: () => {
            this.updateRenewalDate(this.selectedSubscriptionId!, this.selectedDate);
          }
        }
      ]
    });

    await alert.present();
  }

  // Update next renewal date
  updateRenewalDate(subscriptionID: string, nextRenewal: string) {
    this.managePackagesService.updateRenewalDate(subscriptionID, nextRenewal).subscribe((response) => {
      console.log('Renewal Date Update Response:', response);
      this.fetchSubscriptionBySubscriptionID(subscriptionID); // Refresh subscription details
    });
  }

  // Add this helper method
  isCardExpanded(packageCustomerId: string | number): boolean {
    const id = Number(packageCustomerId);
    return this.expandedCards[id] !== false; // Default to true if undefined
  }

  loadUsers() {
    this.managePackagesService.getAllUsers().subscribe(
      (response) => {
        this.users = response.data.users.map((user: any) => ({
          id: user.externalId,
          customerId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          wpUserPhotoUrl: user.wpUserPhotoUrl,
        }));
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }

  setupSearchSubscription() {
    this.searchSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.filteredUsers = this.users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query.toLowerCase()) ||
          user.lastName.toLowerCase().includes(query.toLowerCase())
      );
    });
  }

    // Add these new methods
  toggleAppointments(packageCustomerId: number): void {
    this.visibleAppointments[packageCustomerId] = !this.visibleAppointments[packageCustomerId];
    
    // Fetch appointments if they're not already loaded and section is being opened
    if (this.visibleAppointments[packageCustomerId] && 
        (!this.appointments[packageCustomerId] || this.appointments[packageCustomerId].length === 0)) {
      const pkg = this.packages.find(p => p.packageCustomerId === packageCustomerId);
      if (pkg) {
        this.fetchAppointmentsForPackage(packageCustomerId, pkg.purchased);
      }
    }
  }

  isAppointmentsVisible(packageCustomerId: number): boolean {
    return !!this.visibleAppointments[packageCustomerId];
  }

  // Modify the existing toggleAddTraining method
  toggleAddTraining(packageCustomerId: number): void {
    // Close other open forms first
    Object.keys(this.showAddTrainingForm).forEach(key => {
      if (parseInt(key) !== packageCustomerId) {
        this.showAddTrainingForm[parseInt(key)] = false;
      }
    });
    
    this.showAddTrainingForm[packageCustomerId] = !this.showAddTrainingForm[packageCustomerId];
    
    // Reset form when closing
    if (!this.showAddTrainingForm[packageCustomerId]) {
      this.newTraining = {
        dateTime: '',
        location: 'main'
      };
    }
  }

  onSearchQueryChange(event: any) {
    const query = event.detail.value;
    this.searchSubject.next(query);
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.filteredUsers = [];
    this.searchQuery = `${user.firstName} ${user.lastName}`;
    this.fetchUserPackages(user.customerId);
    this.fetchSubscription(user.id);
  
  }

  fetchUserPackages(customerId: string) {
    this.managePackagesService.getUserPackages(customerId).subscribe(
      (response) => {
        if (!response?.data) {
          console.error('Error: response data is undefined or null');
          this.packages = [];
          return;
        }
  
        this.packages = response.data.flatMap((pkg: any) => {
          if (!pkg.packages) return [];
          return pkg.packages.flatMap((p: any) => {
            if (!p.purchases) return [];
            return p.purchases.flatMap((purchase: any) => {
              if (!purchase.purchase) return [];
              return purchase.purchase.map((service: any) => ({
                customerId: pkg.customerId,
                packageId: p.packageId,
                packageCustomerId: purchase.packageCustomerId,
                serviceId: service.serviceId,
                available: service.available,
                total: service.total,
                purchased: purchase.purchased, // Map purchased property
              }));
            });
          });
        });

      },
      (error) => {
        console.error('Error fetching packages:', error);
        this.packages = [];
      }
    );
  }
  
  fetchAppointmentsForPackage(packageCustomerId: number, purchased: string): void {
    this.currentPackageId = packageCustomerId;
    this.currentPurchaseDate = purchased;
  
    this.managePackagesService.getAppointments(packageCustomerId, purchased).subscribe(
      (appointments: Appointment[]) => {
        this.appointments[packageCustomerId] = appointments;
      },
      (error) => {
        console.error('Error fetching appointments:', error);
      }
    );
  }
  
  translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      approved: 'מאושר',
      canceled: 'בוטל',
      pending: 'בהמתנה',
    };
    return statusMap[status] || 'לא ידוע';
  }

  cancelAppointment(bookingId: string): void {
    if (confirm('האם אתה בטוח שברצונך לבטל את הפגישה?')) {
      this.managePackagesService.cancelAppointment(bookingId).subscribe(
        () => {
          alert('הפגישה בוטלה בהצלחה');
          // Refresh the appointments after cancellation
          if (this.currentPackageId && this.currentPurchaseDate) {
            this.fetchAppointmentsForPackage(this.currentPackageId, this.currentPurchaseDate);
          }
        },
        (error) => {
          console.error('Error canceling appointment:', error);
          alert('אירעה שגיאה בעת ביטול הפגישה');
        }
      );
    }
  }

  addTraining(packageCustomerId: number, serviceId: number): void {
    if (!this.newTraining.dateTime) {
      alert('אנא הזן תאריך ושעה לאימון');
      return;
    }

    if (!this.selectedUser) {
      alert('משתמש לא נבחר');
      return;
    }

    const bookingStart = new Date(this.newTraining.dateTime).toISOString(); // Format to ISO
    const locationId = this.newTraining.location === 'main' ? 1 : 2; // Map location to ID

    const enrollData = {
      type: 'appointment',
      serviceId: serviceId,
      providerId: null,
      locationId: locationId,
      notifyParticipants: 0,
      bookings: [
        {
          customerId: this.selectedUser.id,
          status: 'approved',
          duration: 3600,
          persons: 1,
          extras: [],
          customFields: {},
          utcOffset: -(new Date().getTimezoneOffset()),
          packageCustomerService: {
            packageCustomer: {
              id: packageCustomerId,
            },
          },
        },
      ],
      bookingStart: bookingStart,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.http.post('https://k-studio.co.il/wp-json/wn/v1/bookTrainingNEW', enrollData, {
      headers: { 'Content-Type': 'application/json' },
    }).subscribe(
      (response: any) => {
        if (response.data?.timeSlotUnavailable) {
          alert('משבצת הזמן אינה זמינה');
          return;
        }
        alert('האימון נוסף בהצלחה');
        this.newTraining = { dateTime: '', location: 'main' }; // Reset the form
      },
      (error) => {
        console.error('Error Adding Training:', error);
        alert('שגיאה בהוספת האימון');
      }
    );
  }
}
