import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Block {
  title: string;
  description: string;
  image: string;
}


@Injectable({
  providedIn: 'root'
})
export class BlocksService {
  private apiURL = 'https://k-studio.co.il/wp-json/wn/v1/blocks';

  constructor(private http: HttpClient) { }

  getBlocks(): Observable<Block[]>{
    return this.http.get<Block[]>(this.apiURL);
  }
}
