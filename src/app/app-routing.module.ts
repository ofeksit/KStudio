import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'home', loadChildren: () => import('./home/home.module').then( m => m.HomePageModule) },
  { path: 'login', loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule) },
  { path: 'trainings', loadChildren: () => import('./trainings/trainings.module').then( m => m.TrainingsPageModule) },
  { path: 'payments', loadChildren: () => import('./payments/payments.module').then( m => m.PaymentsPageModule) },
  //{ path: 'users-panel', loadChildren: () => import('./users/users.module').then( m => m.UsersPageModule) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
