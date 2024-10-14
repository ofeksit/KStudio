import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';  // Import this
import { MatButtonModule } from '@angular/material/button';  // Import button module if using buttons
import { MatToolbarModule } from '@angular/material/toolbar';  // Import toolbar module


import { IonicModule } from '@ionic/angular';

import { TrainingsPageRoutingModule } from './trainings-routing.module';

import { TrainingsPage } from './trainings.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrainingsPageRoutingModule,
    MatListModule,
    MatButtonModule,
    MatToolbarModule
  ],
  declarations: [TrainingsPage]
})
export class TrainingsPageModule {}
