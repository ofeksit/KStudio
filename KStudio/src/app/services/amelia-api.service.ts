import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AmeliaService {

  private apiUrl = '/appointments';  // Use the proxy here

  constructor(private http: HttpClient) { }

  getData() {
    this.http.get('/api/appointments', {
      headers: {
        'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'
      }
    })
    .subscribe(response => {
      console.log(response);
    });
  }

}
