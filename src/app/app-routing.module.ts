import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'home', loadChildren: () => import('./home/home.module').then( m => m.HomePageModule) },
  { path: 'login', loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule) },
  { path: 'trainings', loadChildren: () => import('./trainings/trainings.module').then( m => m.TrainingsPageModule) },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },  {
    path: 'attendance-dashboard',
    loadChildren: () => import('./trainer/attendance-dashboard/attendance-dashboard.module').then( m => m.AttendanceDashboardPageModule)
  },
  {
    path: 'attendance-marker',
    loadChildren: () => import('./trainer/attendance-marker/attendance-marker.module').then( m => m.AttendanceMarkerPageModule)
  }


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
