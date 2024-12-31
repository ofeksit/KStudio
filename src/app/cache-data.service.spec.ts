import { TestBed } from '@angular/core/testing';

import { CacheDataService } from './cache-data.service';

describe('CacheDataService', () => {
  let service: CacheDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
