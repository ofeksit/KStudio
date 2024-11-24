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
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProfilePopupComponent } from '../profile-popup/profile-popup.component';
import { PurchaseComponent } from '../purchase/purchase.component';
import { CalendarPopupComponent } from '../calendar-popup/calendar-popup.component';



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
  declarations: [HomePage, NotificationPopupComponent, ProfilePopupComponent, PurchaseComponent, CalendarPopupComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePageModule {}
