// src/app/overlay-debug.ts
export function logOverlays(): void {
    const overlays = Array.from(
      document.querySelectorAll<HTMLElement>(
        'ion-modal, ion-alert, ion-popover, ion-action-sheet, ion-toast, ion-picker'
      )
    );
  
    console.table(
      overlays.map((o, i) => ({
        idx     : i,                               // DOM order = z-index
        tag     : o.tagName.toLowerCase(),
        hidden  : o.getAttribute('aria-hidden'),
        classes : o.className
      }))
    );
  }
  