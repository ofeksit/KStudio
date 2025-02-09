import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-edit-note',
  templateUrl: './edit-note.component.html',
  styleUrls: ['./edit-note.component.scss'],
})
export class EditNoteComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() content: string = '';
  @Input() color: string = '';
  @Input() onSave!: (title: string, content: string, color: string) => void;
  @ViewChild('modalContainer', { static: true }) modalContainer!: ElementRef;

  private originalMarginTop = '50%';

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.handleKeyboardEvents();
  }

  ngOnDestroy() {
    this.removeKeyboardListeners();
  }

  saveChanges() {
    this.onSave(this.title, this.content, this.color);
    this.modalController.dismiss();
  }

  closeModal() {
    this.modalController.dismiss();
  }

  private handleKeyboardEvents() {
    // Listen for keyboard open event
    Keyboard.addListener('keyboardWillShow', (info) => {
      this.adjustModalPosition(info.keyboardHeight);
    });

    // Listen for keyboard close event
    Keyboard.addListener('keyboardWillHide', () => {
      this.resetModalPosition();
    });

    // For web compatibility (works in desktop browsers too)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (window.visualViewport && window.visualViewport.height < window.innerHeight) {
          this.adjustModalPosition(window.innerHeight - window.visualViewport.height);
        } else {
          this.resetModalPosition();
        }
      });
    }
  }

  private removeKeyboardListeners() {
    Keyboard.removeAllListeners();
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', () => {});
    }
  }

  private adjustModalPosition(keyboardHeight: number) {
    if (this.modalContainer) {
      this.modalContainer.nativeElement.style.marginTop = `calc(50% - ${keyboardHeight / 2}px)`;
    }
  }

  private resetModalPosition() {
    if (this.modalContainer) {
      this.modalContainer.nativeElement.style.marginTop = this.originalMarginTop;
    }
  }
}
