import { Component, OnInit } from '@angular/core';
import { PurchaseService } from '../services/purchase.service';
import { AuthService  } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent  implements OnInit {
  private customApiUrl = 'https://k-studio.co.il/wp-json/custom-api/v1/update-order/';
  private paymentUrl = 'https://payments.payplus.co.il/l/b0fb438b-1260-4fab-af42-eaa762c436c0';  // Replace with actual PayPlus payment URL 12 Enters Subscription

  constructor(private purchaseService: PurchaseService, private authService: AuthService, private http: HttpClient) { }

  ngOnInit() {
    this.createNewOrder();
  }


  createNewOrder() {
    // Retrieve user details from localStorage
    const fullName = localStorage.getItem('full_name');
    const userEmail = localStorage.getItem('user_email');
    const userId = localStorage.getItem('user_id');

    // Split fullName into first_name and last_name
    const [firstName, lastName] = fullName ? fullName.split(' ') : ['First', 'Last'];

    // First, open the PayPlus payment page for user to pay
    this.openPaymentPage(this.paymentUrl);

    // Assume you receive a callback or a success status from PayPlus after payment
    this.handlePaymentConfirmation().then((paymentSuccess) => {
      if (paymentSuccess) {
        // Payment was successful, now create the WooCommerce order
        const orderData = {
          payment_method: "bacs",  // Update as needed
          payment_method_title: "Direct Bank Transfer",
          set_paid: true,
          billing: {
            first_name: firstName || 'First',
            last_name: lastName || 'Last',
            email: userEmail || 'default@example.com'
          },
          shipping: {
            first_name: firstName || 'First',
            last_name: lastName || 'Last',
          },
          line_items: []  // No line items for now
        };

        // Create the order in WooCommerce
        this.purchaseService.createOrder(orderData).subscribe(response => {
          const orderId = response.id;  // Get the newly created order ID

          // Call custom API to assign the user to the order
          this.assignUserToOrder(orderId, userId);
        }, error => {
          console.error('Error creating order', error);
        });
      } else {
        console.error('Payment failed');
      }
    });
  }

  // Function to poll the backend for payment confirmation
  handlePaymentConfirmation(orderReference: string): Promise<boolean> {
    return new Promise((resolve) => {
      let retries = 0;
      const maxRetries = 10;  // Poll up to 10 times
      const interval = 5000;  // Poll every 5 seconds

      const checkPaymentStatus = () => {
        this.http.get(`https://k-studio.co.il/payplus-callback?order_ref=${orderReference}`)
          .subscribe((response: any) => {
            if (response && response.status === 'success') {
              resolve(true);  // Payment confirmed
            } else if (retries < maxRetries) {
              retries++;
              setTimeout(checkPaymentStatus, interval);  // Poll again after 5 seconds
            } else {
              resolve(false);  // Payment failed or timed out
            }
          }, error => {
            console.error('Error checking payment status', error);
            resolve(false);
          });
      };

      // Start polling for payment status
      checkPaymentStatus();
    });
  }

  // Function to call custom endpoint to assign user to order
  assignUserToOrder(orderId: number, userId: string | null) {
    const requestData = {
      order_id: orderId,
      user_id: userId
    };

    this.http.post(this.customApiUrl, requestData).subscribe(response => {
      console.log('User assigned to order successfully', response);
    }, error => {
      console.error('Error assigning user to order', error);
    });
  }
}
