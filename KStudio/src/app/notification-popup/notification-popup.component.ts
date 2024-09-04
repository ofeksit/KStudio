import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.scss'],
})
export class NotificationPopupComponent {

  notifications = [
    { title: 'כותרת הודעה 1', description: 'זה התיאור של הודעה ראשונה.' },
    { title: 'כותרת הודעה 2', description: 'זה התיאור של הודעה שנייה.' },
    { title: 'כותרת הודעה 3', description: 'זה התיאור של הודעה שלישית.' }
  ];

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
