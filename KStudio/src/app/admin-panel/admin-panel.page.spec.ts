import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPanelPage } from './admin-panel.page';

describe('AdminPanelPage', () => {
  let component: AdminPanelPage;
  let fixture: ComponentFixture<AdminPanelPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminPanelPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
