import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageTrainingsPage } from './manage-trainings.page';

describe('ManageTrainingsPage', () => {
  let component: ManageTrainingsPage;
  let fixture: ComponentFixture<ManageTrainingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageTrainingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
