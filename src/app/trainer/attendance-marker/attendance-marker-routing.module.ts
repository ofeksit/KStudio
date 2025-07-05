import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AttendanceMarkerPage } from './attendance-marker.page';

const routes: Routes = [
  {
    path: '',
    component: AttendanceMarkerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendanceMarkerPageRoutingModule {}
