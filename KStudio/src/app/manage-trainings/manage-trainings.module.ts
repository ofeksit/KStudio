import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageTrainingsPageRoutingModule } from './manage-trainings-routing.module';

import { ManageTrainingsPage } from './manage-trainings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageTrainingsPageRoutingModule
  ],
  declarations: [ManageTrainingsPage]
})
export class ManageTrainingsPageModule {}
