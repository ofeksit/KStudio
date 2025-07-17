import { TestBed } from '@angular/core/testing';

import { AppointmentsCacheService } from './appointments-cache.service';

describe('AppointmentsCacheService', () => {
  let service: AppointmentsCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentsCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
