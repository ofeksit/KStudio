import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageEnrollmentsPage } from './manage-enrollments.page';

describe('ManageEnrollmentsPage', () => {
  let component: ManageEnrollmentsPage;
  let fixture: ComponentFixture<ManageEnrollmentsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageEnrollmentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
