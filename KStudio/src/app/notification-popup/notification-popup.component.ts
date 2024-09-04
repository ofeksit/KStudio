import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';


@Component({
  selector: 'app-notification-popup',
  templateUrl: './notification-popup.component.html',
  styleUrls: ['./notification-popup.component.scss'],
})
export class NotificationPopupComponent  implements AfterViewInit  {

  @ViewChild('popup') popup!: ElementRef;

  // Define the notifications array with some sample data
  notifications = [
    { title: 'הודעה 1', description: 'תיאור הודעה 1' },
    { title: 'הודעה 2', description: 'תיאור הודעה 2' },
    { title: 'הודעה 3', description: 'תיאור הודעה 3' }
  ];


  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController) {}

  ngAfterViewInit() {
    const gesture = this.gestureCtrl.create({
      el: this.popup.nativeElement,
      gestureName: 'swipe-to-close',
      onMove: (ev) => {
        if (ev.deltaY > 100) {
          this.modalCtrl.dismiss();
        }
      },
    });
    gesture.enable(true);
  }


}
