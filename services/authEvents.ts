type Listener = () => void;
let listeners: Listener[] = [];

export function onForceLogout(listener: Listener) {
    listeners.push(listener);
    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
}

export function emitForceLogout() {
    listeners.forEach(l => l());
}