import { Component, OnInit } from '@angular/core';
import { PurchaseService } from '../services/purchase.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss'],
})
export class PurchaseComponent implements OnInit {
  products: any[] = [];
  sanitizedWordPressUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadWordPressPage();
  }

  loadWordPressPage() {
    const wordpressPageUrl = 'https://k-studio.co.il/purchases-angular/';
    this.sanitizedWordPressUrl = this.sanitizer.bypassSecurityTrustResourceUrl(wordpressPageUrl);
  }
}
