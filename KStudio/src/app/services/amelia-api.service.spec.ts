import { TestBed } from '@angular/core/testing';

import { AmeliaApiService } from './amelia-api.service';

describe('AmeliaApiService', () => {
  let service: AmeliaApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmeliaApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
