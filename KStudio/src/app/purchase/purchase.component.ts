import { Component, OnInit } from '@angular/core';
import { PurchaseService } from '../services/purchase.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit {
  products: any[] = [];
  paymentLinks = [
    { title: '12 כניסות', paymentLink: 'https://payments.payplus.co.il/l/b0fb438b-1260-4fab-af42-eaa762c436c0' },
    { title: 'Product 2', paymentLink: 'https://payments.payplus.co.il/l/def456' },
    { title: 'Product 3', paymentLink: 'https://payments.payplus.co.il/l/ghi789' },
    // Add more products and links as needed
  ];
  

  constructor(private purchaseService: PurchaseService, private http: HttpClient) {}

  ngOnInit() {
    this.loadProducts();
  }

  // Load products from a specific WooCommerce category
  loadProducts() {
    const categoryId = 147;  // Example category ID, replace with actual category ID
    this.purchaseService.getProductsByCategory(categoryId).subscribe(products => {
      this.products = products;
      console.log("products",products);
    }, error => {
      console.error('Error loading products', error);
    });
  }

  // Open PayPlus payment page for a specific product
  buyProduct(product: any) {
    const matchingPaymentLink = this.paymentLinks.find(link => link.title === product.name);
  
    if (matchingPaymentLink) {
      // If a matching payment link is found, redirect the user
      window.open(matchingPaymentLink.paymentLink, '_blank');
      this.handlePaymentConfirmation(product.id);  // Poll for payment confirmation
    } else {
      console.error('No matching payment link found for this product');
      // Handle the case when no link is found, e.g., show a message
    }
    if (!matchingPaymentLink) {
      alert('No payment link found for this product');
    }
  }

  // Poll the backend for payment confirmation
  handlePaymentConfirmation(productId: number) {
    const orderReference = this.generateOrderReference();
    
    // Poll for confirmation
    this.checkPaymentStatus(orderReference).then((paymentSuccess) => {
      if (paymentSuccess) {
        alert('Payment approved');
        window.location.href = '/';  // Redirect to home page
      } else {
        alert('Payment failed');
      }
    });
  }

  // Helper function to poll for payment status
  checkPaymentStatus(orderReference: string): Promise<boolean> {
    return new Promise((resolve) => {
      let retries = 0;
      const maxRetries = 10;  // Poll up to 10 times
      const interval = 5000;  // Poll every 5 seconds

      const checkPayment = () => {
        this.http.get(`https://k-studio.co.il/payplus-callback?order_ref=${orderReference}`).subscribe(
          (response: any) => {
            if (response.status === 'success') {
              resolve(true);
            } else if (retries < maxRetries) {
              retries++;
              setTimeout(checkPayment, interval);
            } else {
              resolve(false);
            }
          },
          (error) => {
            console.error('Error checking payment status', error);
            resolve(false);
          }
        );
      };

      checkPayment();
    });
  }

  // Helper function to generate a unique order reference
  generateOrderReference(): string {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}
