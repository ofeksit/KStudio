import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AttendanceMarkerPageRoutingModule } from './attendance-marker-routing.module';

import { AttendanceMarkerPage } from './attendance-marker.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AttendanceMarkerPageRoutingModule
  ],
  declarations: [AttendanceMarkerPage]
})
export class AttendanceMarkerPageModule {}
