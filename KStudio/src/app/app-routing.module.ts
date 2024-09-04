import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'home', loadChildren: () => import('./home/home.module').then( m => m.HomePageModule) },
  { path: 'login', loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule) },
  { path: 'register', loadChildren: () => import('./register/register.module').then( m => m.RegisterPageModule) },
  { path: 'trainings', loadChildren: () => import('./trainings/trainings.module').then( m => m.TrainingsPageModule) },
  { path: 'profile', loadChildren: () => import('./profile/profile.module').then( m => m.ProfilePageModule) },
  { path: 'admin-panel', loadChildren: () => import('./admin-panel/admin-panel.module').then( m => m.AdminPanelPageModule) },
  { path: 'payments', loadChildren: () => import('./payments/payments.module').then( m => m.PaymentsPageModule) },
  { path: 'manage-trainings', loadChildren: () => import('./manage-trainings/manage-trainings.module').then( m => m.ManageTrainingsPageModule) },
  { path: 'manage-enrollments', loadChildren: () => import('./manage-enrollments/manage-enrollments.module').then( m => m.ManageEnrollmentsPageModule) },
  { path: 'send-notifications', loadChildren: () => import('./send-notifications/send-notifications.module').then( m => m.SendNotificationsPageModule) },
  { path: 'users-panel', loadChildren: () => import('./users/users.module').then( m => m.UsersPageModule) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
