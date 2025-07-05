import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AttendanceDashboardPage } from './attendance-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: AttendanceDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendanceDashboardPageRoutingModule {}
