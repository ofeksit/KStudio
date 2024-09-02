import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SendNotificationsPage } from './send-notifications.page';

const routes: Routes = [
  {
    path: '',
    component: SendNotificationsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SendNotificationsPageRoutingModule {}
