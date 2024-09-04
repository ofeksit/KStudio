import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';  // Import this
import { MatButtonModule } from '@angular/material/button';  // Import button module if using buttons
import { MatToolbarModule } from '@angular/material/toolbar';  // Import toolbar module
import { IonicModule } from '@ionic/angular';
import { MatCardModule } from '@angular/material/card';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    MatListModule,
    MatButtonModule,
    MatToolbarModule,
    MatCardModule,
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
