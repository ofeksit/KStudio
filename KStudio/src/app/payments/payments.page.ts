import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
})
export class PaymentsPage implements OnInit {
  currentSubscription: any = {};  // Replace with the correct subscription model
  paymentHistory: any[] = [];  // Replace with the correct payment model

  constructor() {}

  ngOnInit() {
    this.loadCurrentSubscription();
    this.loadPaymentHistory();
  }

  loadCurrentSubscription() {
    // Fetch the user's current subscription
  }

  loadPaymentHistory() {
    // Fetch the user's payment history
  }

  viewPackages() {
    // Navigate to the packages page or show available packages
  }
}
