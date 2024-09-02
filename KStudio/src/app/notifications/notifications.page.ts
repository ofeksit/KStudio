import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
  notifications: any[] = [];  // Replace with the correct notification model

  constructor() {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    // Fetch notifications for the user
  }
}
