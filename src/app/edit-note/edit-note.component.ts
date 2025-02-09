import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-edit-note',
  templateUrl: './edit-note.component.html',
  styleUrls: ['./edit-note.component.scss'],
})
export class EditNoteComponent  implements OnInit {
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() color: string = '';
  @Input() onSave!: (title: string, content: string, color: string) => void;


  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  saveChanges() {
    this.onSave(this.title, this.content, this.color);
    this.modalController.dismiss();
  }

  closeModal() {
    this.modalController.dismiss();
  }

}
