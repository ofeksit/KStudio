import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-send-notifications',
  templateUrl: './send-notifications.page.html',
  styleUrls: ['./send-notifications.page.scss'],
})
export class SendNotificationsPage implements OnInit {
  notificationMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  sendNotification() {
    if (this.notificationMessage.trim()) {
      this.http.post('https://new.k-studio.co.il/sendNotification.php', { message: this.notificationMessage })
        .subscribe(response => {
          console.log('Notification sent:', response);
          this.notificationMessage = '';  // Clear the message field
        }, error => {
          console.error('Failed to send notification:', error);
        });
    } else {
      console.log('Notification message is empty');
    }
  }
}
