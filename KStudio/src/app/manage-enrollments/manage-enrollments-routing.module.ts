import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageEnrollmentsPage } from './manage-enrollments.page';

const routes: Routes = [
  {
    path: '',
    component: ManageEnrollmentsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageEnrollmentsPageRoutingModule {}
