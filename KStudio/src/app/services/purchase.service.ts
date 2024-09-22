import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  private apiUrl = 'https://k-studio.co.il/wp-json/wc/v3';
  private consumerKey = 'ck_7f113feea30db5483137c21d6808dab45eb6a423';
  private consumerSecret = 'cs_b26698fb85d28601832bdb37b1dbc67ab85b09ce';

  constructor(private http: HttpClient) {}

  // Create WooCommerce order
  createOrder(orderData: any): Observable<any> {
    const url = `${this.apiUrl}/orders?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(url, orderData, { headers });
  }

  // Fetch products from a specific category
  getProductsByCategory(categoryId: number): Observable<any> {
    const url = `${this.apiUrl}/products?category=${categoryId}&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;
    return this.http.get(url);
  }

  // Authenticate user with the stored JWT token
  authenticateUser(token: string): Observable<any> {
    const url = `https://k-studio.co.il/wp-json/jwt-auth/v1/token/validate`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, {}, { headers });
  }
}