import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.scss'],
})
export class NotificationPopupComponent {

  notifications = [
    { title: 'Notification 1', description: 'This is the first notification.' },
    { title: 'Notification 2', description: 'This is the second notification.' },
    { title: 'Notification 3', description: 'This is the third notification.' }
  ];

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
