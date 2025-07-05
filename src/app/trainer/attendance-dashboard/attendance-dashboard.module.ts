import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AttendanceDashboardPageRoutingModule } from './attendance-dashboard-routing.module';

import { AttendanceDashboardPage } from './attendance-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AttendanceDashboardPageRoutingModule
  ],
  declarations: [AttendanceDashboardPage]
})
export class AttendanceDashboardPageModule {}
