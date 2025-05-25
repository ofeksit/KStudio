import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const TUTORIAL_KEY = 'hasSeenTutorial';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  constructor() { }

  //Checks if seen
  async checkIfTutorialSeen(): Promise<boolean> {
    const { value } = await Preferences.get({ key: TUTORIAL_KEY });
    return value === 'true';
  }

  //Mark as seen
  async markTutorialAsSeen(): Promise<void> {
    await Preferences.set({ key: TUTORIAL_KEY, value: 'true' });
  }

  //Reset tutorial
  async resetTutorialStatus(): Promise<void> {
    await Preferences.remove({ key: TUTORIAL_KEY });
  }
}