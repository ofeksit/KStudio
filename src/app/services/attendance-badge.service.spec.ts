import { TestBed } from '@angular/core/testing';

import { AttendanceBadgeService } from './attendance-badge.service';

describe('AttendanceBadgeService', () => {
  let service: AttendanceBadgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttendanceBadgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
