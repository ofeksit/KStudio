import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-manage-trainings',
  templateUrl: './manage-trainings.page.html',
  styleUrls: ['./manage-trainings.page.scss'],
})
export class ManageTrainingsPage implements OnInit {
  trainings: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTrainings();
  }

  loadTrainings() {
    this.http.get('https://new.k-studio.co.il/getTrainings.php')
      .subscribe((data: any) => {
        this.trainings = data.trainings;
      }, error => {
        console.error('Failed to load trainings:', error);
      });
  }

  addTraining() {
    // Navigate to add training page or open a modal for adding a new training
  }

  editTraining(trainingId: number) {
    // Navigate to edit training page or open a modal for editing the selected training
  }

  deleteTraining(trainingId: number) {
    this.http.post('https://new.k-studio.co.il/deleteTraining.php', { trainingId })
      .subscribe(response => {
        console.log('Training deleted:', response);
        this.loadTrainings();  // Refresh the list of trainings
      }, error => {
        console.error('Failed to delete training:', error);
      });
  }
}
