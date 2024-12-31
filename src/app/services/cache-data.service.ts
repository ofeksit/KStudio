import { Injectable } from '@angular/core';
import { Appointment  } from '../Models/appointment';
import { BehaviorSubject, Observable } from 'rxjs';

interface CacheData {
  combinedList: Appointment[];
  startDate: Date;
  endDate: Date;
  location: string;
}

@Injectable({
  providedIn: 'root'
})
export class CacheDataService {
  private cacheData = new BehaviorSubject<CacheData | null>(null);
  constructor() { }

  // Store data in cache
  setCacheData(data: Appointment[], startDate: Date, endDate: Date, location: string) {
    this.cacheData.next({
      combinedList: data,
      startDate,
      endDate,
      location
    });
  }

    // Get cached data
  getCacheData(): Observable<CacheData | null> {
    return this.cacheData.asObservable();
  }

  // Check if we have valid cached data for the given parameters
  hasValidCache(startDate: Date, endDate: Date, location: string): boolean {
    const currentCache = this.cacheData.value;
    if (!currentCache) return false;

    return (
      currentCache.location === location &&
      currentCache.startDate.getTime() <= startDate.getTime() &&
      currentCache.endDate.getTime() >= endDate.getTime()
    );
  }

  // Clear the cache
  clearCache() {
    this.cacheData.next(null);
  }
}
