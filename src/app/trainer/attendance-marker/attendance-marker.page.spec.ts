import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceMarkerPage } from './attendance-marker.page';

describe('AttendanceMarkerPage', () => {
  let component: AttendanceMarkerPage;
  let fixture: ComponentFixture<AttendanceMarkerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceMarkerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
