import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController, IonItemSliding } from '@ionic/angular';

@Component({
  selector: 'app-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.scss'],
})
export class NotificationPopupComponent implements OnInit {

  notifications: any[] = [];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit(): void {
    this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  }

  deleteNotification(index: number, slidingItem: IonItemSliding) {
    // Remove the notification from the array
    this.notifications.splice(index, 1);

    // Update the notifications in local storage
    localStorage.setItem('notifications', JSON.stringify(this.notifications));

    // Close the sliding item
    slidingItem.close();
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
