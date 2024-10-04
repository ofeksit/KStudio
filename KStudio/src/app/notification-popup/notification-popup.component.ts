import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.scss'],
})
export class NotificationPopupComponent implements OnInit{

  notifications: any[] = [];

  constructor(private modalCtrl: ModalController) {}
  
  ngOnInit(): void {
    this.notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  }


  dismiss() {
    this.modalCtrl.dismiss();
  }
}
