class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this._listeners[event]) return;
    if (callback) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    } else {
      delete this._listeners[event];
    }
  }

  emit(event, ...args) {
    const cbs = this._listeners[event];
    if (!cbs) return;
    cbs.slice().forEach(cb => cb(...args));
  }

  removeAllListeners() {
    this._listeners = {};
  }
}

export const EventBus = new EventEmitter();
