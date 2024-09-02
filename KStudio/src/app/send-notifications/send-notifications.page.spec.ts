import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SendNotificationsPage } from './send-notifications.page';

describe('SendNotificationsPage', () => {
  let component: SendNotificationsPage;
  let fixture: ComponentFixture<SendNotificationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SendNotificationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
