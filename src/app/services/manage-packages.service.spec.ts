import { TestBed } from '@angular/core/testing';

import { ManagePackagesService } from './manage-packages.service';

describe('ManagePackagesService', () => {
  let service: ManagePackagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManagePackagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
