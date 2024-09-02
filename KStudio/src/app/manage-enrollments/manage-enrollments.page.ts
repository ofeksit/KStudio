import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-manage-enrollments',
  templateUrl: './manage-enrollments.page.html',
  styleUrls: ['./manage-enrollments.page.scss'],
})
export class ManageEnrollmentsPage implements OnInit {
  enrollments: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadEnrollments();
  }

  loadEnrollments() {
    this.http.get('https://new.k-studio.co.il/getEnrollments.php')
      .subscribe((data: any) => {
        this.enrollments = data.enrollments;
      }, error => {
        console.error('Failed to load enrollments:', error);
      });
  }

  cancelEnrollment(enrollmentId: number) {
    this.http.post('https://new.k-studio.co.il/cancelEnrollment.php', { enrollmentId })
      .subscribe(response => {
        console.log('Enrollment canceled:', response);
        this.loadEnrollments();  // Refresh the list of enrollments
      }, error => {
        console.error('Failed to cancel enrollment:', error);
      });
  }
}
