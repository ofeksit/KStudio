import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.page.html',
  styleUrls: ['./admin-panel.page.scss'],
})
export class AdminPanelPage implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {}

  manageTrainings() {
    this.router.navigate(['/manage-trainings']);
  }

  manageEnrollments() {
    this.router.navigate(['/manage-enrollments']);
  }

  sendNotifications() {
    // Implement notification sending logic
  }
}
