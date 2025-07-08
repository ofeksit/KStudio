import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AttendanceDashboardPageRoutingModule } from './attendance-dashboard-routing.module';
import { AttendanceDashboardPage } from './attendance-dashboard.page';
import { AttendanceMarkerComponent } from '../attendance-marker/attendance-marker.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AttendanceDashboardPageRoutingModule
  ],
  declarations: [AttendanceDashboardPage, AttendanceMarkerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AttendanceDashboardPageModule {}
