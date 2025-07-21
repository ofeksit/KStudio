import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import * as moment from 'moment';
import { AuthService } from './auth.service';

/* =========================================================
 * TYPES
 * =======================================================*/
export interface CachedApptSummary {
  isTrainer: boolean;
  appointmentId: number;
  date: string;
  status: string;
  serviceName: string;
  startTime: string;
  providerId: number;
  booked?: number;
  capacity?: number;
  /* legacy alias: we’ll map to isUserBooked downstream */
  isUserBooked?: boolean;
}

export interface ScheduleItem extends CachedApptSummary {
  serviceId?: number;
  trainerEmail?: string | null;
  isUserBooked?: boolean;
  progressPercentage?: number; // Add this line
}

interface AppointmentsCachePayload {
  version: number;
  fetchedAt: number;
  validUntil: number;
  userId: number;
  role: string | null;
  rangeStart: string;
  rangeEnd: string;
  items: CachedApptSummary[];
}

interface SchedCachePayload {
  version: number;
  fetchedAt: number;
  validUntil: number;
  userId: number;
  role: string | null;
  days: number;
  items: ScheduleItem[];
}

/* =========================================================
 * SERVICE
 * =======================================================*/
@Injectable({ providedIn: 'root' })
export class AppointmentsCacheService {

  private readonly API_BASE    = 'https://k-studio.co.il/wp-json/custom-api/v1';
  private readonly STORAGE_KEY = 'kstudio.apptCache.v1';          // upcoming (user+trainer)
  private readonly SCHED_KEY   = 'kstudio.trainingsSchedule.v1';  // full schedule

  private readonly HARD_TTL_MS = 10 * 60 * 1000; // 10m
  private readonly SOFT_TTL_MS =  2 * 60 * 1000; // 2m

  /* upcoming (user+trainer) */
  private _items$ = new BehaviorSubject<CachedApptSummary[] | null>(null);
  readonly items$ = this._items$.asObservable();
  private memCache: AppointmentsCachePayload | null = null;
  private inFlight?: Promise<CachedApptSummary[]>;

  /* full schedule */
  private _schedule$ = new BehaviorSubject<ScheduleItem[] | null>(null);
  readonly schedule$ = this._schedule$.asObservable();
  private schedMem: SchedCachePayload | null = null;
  private schedInFlight?: Promise<ScheduleItem[]>;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  /* -------------------------------------------------------
   * UPCOMING (user+trainer)
   * ---------------------------------------------------- */
  async ensureLoaded(force = false): Promise<CachedApptSummary[]> {
    const userId     = Number(this.auth.getUserID() ?? 0);
    const customerId = Number(this.auth.getCustomerID() ?? 0);
    const role       = this.auth.getUserRole ? this.auth.getUserRole() : null;

    if (!userId) {
      await this.invalidate();
      return [];
    }

    if (!force) {
      const cached = this.loadFromLS();
      const now = Date.now();
      if (cached &&
          cached.userId === userId &&
          cached.role === role &&
          now < cached.validUntil) {
        this.memCache = cached;
        if (!this._items$.value) this._items$.next(cached.items);
        if (now - cached.fetchedAt > this.SOFT_TTL_MS) {
          this.refreshInBackground(userId, customerId);
        }
        return cached.items;
      }
    }
    this.fetchAndCacheSchedule(20, userId, customerId);
    return this.fetchAndCache(userId, customerId);
    
  }

  async refresh(): Promise<CachedApptSummary[]> {
    const userId     = Number(this.auth.getUserID() ?? 0);
    const customerId = Number(this.auth.getCustomerID() ?? 0);
    return this.fetchAndCache(userId, customerId);
  }

  async invalidate(): Promise<void> {
    this.memCache = null;
    try { localStorage.removeItem(this.STORAGE_KEY); } catch {}
    this._items$.next(null);
  }

  private refreshInBackground(userId: number, customerId: number) {
    if (this.inFlight) return;
    this.fetchAndCache(userId, customerId).catch(() => {});
  }

  private async fetchAndCache(userId: number, customerId: number): Promise<CachedApptSummary[]> {
    if (!this.inFlight) {
      const url = `${this.API_BASE}/app-appointments/${userId}/${customerId}`;
      console.log('[ApptCache] upcoming fetch', url);
      this.inFlight = firstValueFrom(this.http.get<CachedApptSummary[]>(url))
        .then(items => {
          console.log('[ApptCache] upcoming fetched', items?.length ?? 0);
          const payload: AppointmentsCachePayload = {
            version: 1,
            fetchedAt: Date.now(),
            validUntil: Date.now() + this.HARD_TTL_MS,
            userId,
            role: this.auth.getUserRole ? this.auth.getUserRole() : null,
            rangeStart: moment().format('YYYY-MM-DD'),
            rangeEnd: moment().add(25, 'days').format('YYYY-MM-DD'),
            items: items ?? [],
          };
          this.memCache = payload;
          this.saveToLS(payload);
          this._items$.next(payload.items);
          return payload.items;
        })
        .finally(() => { this.inFlight = undefined; });
    }
    return this.inFlight;
  }

  private loadFromLS(): AppointmentsCachePayload | null {
    if (this.memCache) return this.memCache;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AppointmentsCachePayload;
      if (!Array.isArray(parsed.items)) return null;
      this.memCache = parsed;
      return parsed;
    } catch { return null; }
  }

  private saveToLS(payload: AppointmentsCachePayload) {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload)); }
    catch (err) { console.error('Appointments cache save failed (upcoming)', err); }
  }

  /* -------------------------------------------------------
   * FULL SCHEDULE (all trainings)
   * ---------------------------------------------------- */
  async ensureScheduleLoaded(days = 20, force = false): Promise<ScheduleItem[]> {
    const userId     = Number(this.auth.getUserID() ?? 0);
    const customerId = Number(this.auth.getCustomerID() ?? 0);
    const role       = this.auth.getUserRole ? this.auth.getUserRole() : null;

    if (!userId) {
      await this.invalidateSchedule();
      return [];
    }

    if (!force) {
      const cached = this.loadScheduleFromLS();
      const now = Date.now();
      if (cached &&
          cached.userId === userId &&
          cached.role === role &&
          cached.days === days &&
          now < cached.validUntil) {
        this.schedMem = cached;
        if (!this._schedule$.value) this._schedule$.next(cached.items);
        if (now - cached.fetchedAt > this.SOFT_TTL_MS) {
          this.refreshScheduleInBackground(days, userId, customerId);
        }
        return cached.items;
      }
    }
    return this.fetchAndCacheSchedule(days, userId, customerId);
  }

  async refreshSchedule(days = 20): Promise<ScheduleItem[]> {
    const userId     = Number(this.auth.getUserID() ?? 0);
    const customerId = Number(this.auth.getCustomerID() ?? 0);
    return this.fetchAndCacheSchedule(days, userId, customerId);
  }

  async invalidateSchedule(): Promise<void> {
    this.schedMem = null;
    try { localStorage.removeItem(this.SCHED_KEY); } catch {}
    this._schedule$.next(null);
  }

  private refreshScheduleInBackground(days: number, userId: number, customerId: number) {
    if (this.schedInFlight) return;
    this.fetchAndCacheSchedule(days, userId, customerId).catch(() => {});
  }

  private async fetchAndCacheSchedule(days: number, userId: number, customerId: number): Promise<ScheduleItem[]> {
    if (!this.schedInFlight) {
      const url = `${this.API_BASE}/trainings-schedule/${userId}/${customerId}?days=${days}`;
      console.log('[ApptCache] schedule fetch', url);
      this.schedInFlight = firstValueFrom(this.http.get<ScheduleItem[]>(url))
        .then(items => {
          console.log('[ApptCache] schedule fetched', items?.length ?? 0);
          
          // Process items to add progressPercentage
          const processedItems = (items ?? []).map(item => ({
            ...item,
            progressPercentage: this.calculateProgressPercentage(item)
          }));
          
          const payload: SchedCachePayload = {
            version: 1,
            fetchedAt: Date.now(),
            validUntil: Date.now() + this.HARD_TTL_MS,
            userId,
            role: this.auth.getUserRole ? this.auth.getUserRole() : null,
            days,
            items: processedItems,
          };
          this.schedMem = payload;
          this.saveScheduleToLS(payload);
          this._schedule$.next(payload.items);
          return payload.items;
        })
        .finally(() => { this.schedInFlight = undefined; });
    }
    return this.schedInFlight;
  }

  private loadScheduleFromLS(): SchedCachePayload | null {
    if (this.schedMem) return this.schedMem;
    try {
      const raw = localStorage.getItem(this.SCHED_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SchedCachePayload;
      if (!Array.isArray(parsed.items)) return null;
      this.schedMem = parsed;
      return parsed;
    } catch { return null; }
  }

  private saveScheduleToLS(payload: SchedCachePayload) {
    try { localStorage.setItem(this.SCHED_KEY, JSON.stringify(payload)); }
    catch (err) { console.error('Trainings schedule cache save failed', err); }
  }

  /* -------------------------------------------------------
   * PARTICIPANTS (trainer click-through)
   * ---------------------------------------------------- */
  async loadParticipants(appointmentId: number) {
    const url = `${this.API_BASE}/appointment-participants/${appointmentId}`;
    return firstValueFrom(this.http.get<any[]>(url));
  }

  private calculateProgressPercentage(item: ScheduleItem): number {
    if (!item.booked || !item.capacity) {
      return 0;
    }
    const progress = (item.booked / item.capacity) * 100;
    return progress > 100 ? 100 : progress; // Ensure the progress doesn't exceed 100%
  }

}
