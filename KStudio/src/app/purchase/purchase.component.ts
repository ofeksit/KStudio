import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router'; // If you want to redirect users after purchase

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit {
  sanitizedWordPressUrl: SafeResourceUrl | null = null;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWordPressPage();

    // Listen for messages from the iframe (WordPress)
    window.addEventListener('message', this.handlePostMessage.bind(this));
  }

  loadWordPressPage() {
    const wordpressPageUrl = 'https://k-studio.co.il/purchases-angular/';
    this.sanitizedWordPressUrl = this.sanitizer.bypassSecurityTrustResourceUrl(wordpressPageUrl);
  }

  // Handle the postMessage event
  handlePostMessage(event: MessageEvent) {
    if (event.data && event.data.productId && event.data.checkoutUrl) {
      this.purchaseProduct(event.data.productId, event.data.checkoutUrl);
    }
  }

  // Function to trigger purchase and login to WordPress using token
  purchaseProduct(productId: number, checkoutUrl: string) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('User is not logged in.');
        return;
    }

    // Ensure the token is validated before redirect
    const loginUrl = 'https://k-studio.co.il/wp-json/jwt-auth/v1/token/validate';
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    });

    this.http.post(loginUrl, {}, { headers }).subscribe(
        (response: any) => {
            console.log('User authenticated successfully:', response);

            // Redirect to WooCommerce checkout URL with token
            const redirectUrl = `${checkoutUrl}?jwt_token=${token}`;
            window.location.href = redirectUrl;
        },
        (error: any) => {
            console.error('Error authenticating user:', error);
            alert('Authentication failed. Please log in again.');
        }
    );
  }

  loginAndRedirectToCart() {
    const authToken = localStorage.getItem('auth_token');

    if (!authToken) {
      console.error('No auth token found');
      return;
    }

    // Create the headers for the login request
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${authToken}`, // Attach the JWT token here
    });

    // Send the token to your WordPress login URL (JWT auth endpoint)
    this.http.post('https://k-studio.co.il/wp-json/jwt-auth/v1/token/validate', {}, { headers })
      .subscribe(
        (response: any) => {
          // If the authentication is successful, redirect to WooCommerce add-to-cart URL
          if (response.success) {
            // Replace with your specific product's "add to cart" URL and the product ID
            const productID = 9735; // Replace with your product ID
            const redirectUrl = `https://k-studio.co.il/?add-to-cart=${productID}`;
            
            // Redirect to WooCommerce checkout with the product added to the cart
            window.location.href = redirectUrl;
          } else {
            console.error('Authentication failed');
          }
        },
        (error) => {
          console.error('Error during login', error);
        }
      );
  }

}
