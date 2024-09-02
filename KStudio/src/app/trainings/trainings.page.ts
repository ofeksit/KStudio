import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements OnInit {

  trainings = [
    {
      title: 'Pilates Machines',
      date: '02/09',
      time: '08:30 - 09:25',
      location: 'Main Studio',
      availableSlots: 14,
      totalSlots: 14
    },
    // Add more training sessions here
  ];

  constructor() {}

  ngOnInit() {}

  enroll(trainingId: number) {
    console.log('Enrolling in training:', trainingId);
  }
}
