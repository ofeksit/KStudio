import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageTrainingsPage } from './manage-trainings.page';

const routes: Routes = [
  {
    path: '',
    component: ManageTrainingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageTrainingsPageRoutingModule {}
