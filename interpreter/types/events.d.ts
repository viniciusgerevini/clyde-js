export function Events(): {
    events: {
        VARIABLE_CHANGED: string;
        EVENT_TRIGGERED: string;
    };
    triggerEvent(name: any, data: any): void;
    addListener(name: any, callback: any): any;
    removeListener(name: any, callback: any): void;
};
export namespace events {
    const VARIABLE_CHANGED: string;
    const EVENT_TRIGGERED: string;
}
