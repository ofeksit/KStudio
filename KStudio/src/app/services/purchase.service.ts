import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  private apiUrl = 'https://k-studio.co.il/wp-json/wc/v3/orders';
  private consumerKey = 'ck_7f113feea30db5483137c21d6808dab45eb6a423';
  private consumerSecret = 'cs_b26698fb85d28601832bdb37b1dbc67ab85b09ce';

  constructor(private http: HttpClient) {}

  createOrder(orderData: any): Observable<any> {
    const url = `${this.apiUrl}?consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(url, orderData, { headers });
  }
}