const addMultipleEventListener = (target, eventNames, listener) => {
    const events = eventNames.split(" ");
    events.forEach(event => target.addEventListener(event, listener, false));
};

Reflect.defineProperty(EventTarget.prototype, "on", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function (eventNames, listener) {
        const events = eventNames.split(" ");
        events.forEach(event => this.addEventListener(event, listener, false));
    },
});