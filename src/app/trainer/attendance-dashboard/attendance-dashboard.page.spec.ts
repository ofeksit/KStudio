import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceDashboardPage } from './attendance-dashboard.page';

describe('AttendanceDashboardPage', () => {
  let component: AttendanceDashboardPage;
  let fixture: ComponentFixture<AttendanceDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
