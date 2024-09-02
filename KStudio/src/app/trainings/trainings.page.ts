import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Training } from '../Models/training';

@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements OnInit {

  trainings: Training[] = [];  // Use the Training interface

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTrainings();
  }

  loadTrainings() {
    this.http.get<Training[]>('https://new.k-studio.co.il/getTrainings.php')
      .subscribe((data: Training[]) => {
        this.trainings = data;
      }, error => {
        console.error('Failed to load trainings:', error);
      });
  }

  enroll(trainingId: number) {
    const payload = { trainingId, userId: 1 }; // Assume user ID is 1 for now
    this.http.post('https://k-studio.co.il/enrollTraining.php', payload)
      .subscribe(response => {
        console.log('Enrollment successful:', response);
        // Optionally refresh the list of trainings or update UI
      }, error => {
        console.error('Failed to enroll:', error);
      });
  }
}
