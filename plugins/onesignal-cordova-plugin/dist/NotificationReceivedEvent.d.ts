import { OSNotification } from './OSNotification';
export declare class NotificationWillDisplayEvent {
    private notification;
    constructor(displayEvent: OSNotification);
    preventDefault(): void;
    getNotification(): OSNotification;
}
