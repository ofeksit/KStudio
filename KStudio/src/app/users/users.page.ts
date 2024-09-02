import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage implements OnInit {
  users: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getUsers().subscribe(
      (data: any) => {
        this.users = data.users;
      },
      (error) => {
        console.error('Failed to load users', error);
      }
    );
  }

  async addUser() {
    const alert = await this.alertController.create({
      header: 'Add New User',
      inputs: [
        { name: 'user_login', type: 'text', placeholder: 'Username' },
        { name: 'user_nicename', type: 'text', placeholder: 'Nice Name' },
        { name: 'user_email', type: 'email', placeholder: 'Email' },
        { name: 'user_pass', type: 'password', placeholder: 'Password' },
        { name: 'display_name', type: 'text', placeholder: 'Display Name' },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Add',
          handler: (data) => {
            this.authService.addUser(data).subscribe(
              () => {
                this.loadUsers();
              },
              (error) => {
                console.error('Failed to add user', error);
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }

  async editUser(user: any) {
    const alert = await this.alertController.create({
      header: 'Edit User',
      inputs: [
        { name: 'user_login', type: 'text', placeholder: 'Username', value: user.user_login },
        { name: 'user_nicename', type: 'text', placeholder: 'Nice Name', value: user.user_nicename },
        { name: 'user_email', type: 'email', placeholder: 'Email', value: user.user_email },
        { name: 'display_name', type: 'text', placeholder: 'Display Name', value: user.display_name },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            const updatedUser = { ...user, ...data };
            this.authService.editUser(updatedUser).subscribe(
              () => {
                this.loadUsers();
              },
              (error) => {
                console.error('Failed to edit user', error);
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }

  async removeUser(userId: number) {
    const alert = await this.alertController.create({
      header: 'Confirm',
      message: 'Are you sure you want to delete this user?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          handler: () => {
            this.authService.deleteUser(userId).subscribe(
              () => {
                this.loadUsers();
              },
              (error) => {
                console.error('Failed to delete user', error);
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }
}
