import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageEnrollmentsPageRoutingModule } from './manage-enrollments-routing.module';

import { ManageEnrollmentsPage } from './manage-enrollments.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageEnrollmentsPageRoutingModule
  ],
  declarations: [ManageEnrollmentsPage]
})
export class ManageEnrollmentsPageModule {}
