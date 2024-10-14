import PushSubscription from "./PushSubscriptionNamespace";
export interface UserState {
    onesignalId?: string;
    externalId?: string;
}
export interface UserChangedState {
    current: UserState;
}
export default class User {
    pushSubscription: PushSubscription;
    private _userStateObserverList;
    private _processFunctionList;
    /**
     * Explicitly set a 2-character language code for the user.
     * @param  {string} language
     * @returns void
     */
    setLanguage(language: string): void;
    /**
     * Aliases
     */
    /**
     * Set an alias for the current user. If this alias label already exists on this user, it will be overwritten with the new alias id.
     * @param  {string} label
     * @param  {string} id
     * @returns void
     */
    addAlias(label: string, id: string): void;
    /**
     * Set aliases for the current user. If any alias already exists, it will be overwritten to the new values.
     * @param {object} aliases
     * @returns void
     */
    addAliases(aliases: object): void;
    /**
     * Remove an alias from the current user.
     * @param  {string} label
     * @returns void
     */
    removeAlias(label: string): void;
    /**
     * Remove aliases from the current user.
     * @param  {string[]} labels
     * @returns void
     */
    removeAliases(labels: string[]): void;
    /**
     * Email
     */
    /**
     * Add a new email subscription to the current user.
     * @param  {string} email
     * @returns void
     */
    addEmail(email: string): void;
    /**
     * Remove an email subscription from the current user. Returns false if the specified email does not exist on the user within the SDK, and no request will be made.
     * @param {string} email
     * @returns void
     */
    removeEmail(email: string): void;
    /**
     * SMS
     */
    /**
     * Add a new SMS subscription to the current user.
     * @param  {string} smsNumber
     * @returns void
     */
    addSms(smsNumber: string): void;
    /**
     * Remove an SMS subscription from the current user. Returns false if the specified SMS number does not exist on the user within the SDK, and no request will be made.
     * @param {string} smsNumber
     * @returns void
     */
    removeSms(smsNumber: string): void;
    /**
     * Tags
     */
    /**
     * Add a tag for the current user. Tags are key:value string pairs used as building blocks for targeting specific users and/or personalizing messages. If the tag key already exists, it will be replaced with the value provided here.
     * @param  {string} key
     * @param  {string} value
     * @returns void
     */
    addTag(key: string, value: string): void;
    /**
     * Add multiple tags for the current user. Tags are key:value string pairs used as building blocks for targeting specific users and/or personalizing messages. If the tag key already exists, it will be replaced with the value provided here.
     * @param  {object} tags
     * @returns void
     */
    addTags(tags: object): void;
    /**
     * Remove the data tag with the provided key from the current user.
     * @param  {string} key
     * @returns void
     */
    removeTag(key: string): void;
    /**
     * Remove multiple tags with the provided keys from the current user.
     * @param  {string[]} keys
     * @returns void
     */
    removeTags(keys: string[]): void;
    /** Returns the local tags for the current user.
     * @returns Promise<{ [key: string]: string }>
     */
    getTags(): Promise<{
        [key: string]: string;
    }>;
    /**
     * Add a callback that fires when the OneSignal User state changes.
     * Important: When using the observer to retrieve the onesignalId, check the externalId as well to confirm the values are associated with the expected user.
     * @param  {(event: UserChangedState)=>void} listener
     * @returns void
     */
    addEventListener(event: "change", listener: (event: UserChangedState) => void): void;
    /**
     * Remove a User State observer that has been previously added.
     * @param  {(event: UserChangedState)=>void} listener
     * @returns void
     */
    removeEventListener(event: "change", listener: (event: UserChangedState) => void): void;
    /**
     * Get the nullable OneSignal Id associated with the current user.
     * @returns {Promise<string | null>}
     */
    getOnesignalId(): Promise<string | null>;
    /**
     * Get the nullable External Id associated with the current user.
     * @returns {Promise<string | null>}
     */
    getExternalId(): Promise<string | null>;
}
