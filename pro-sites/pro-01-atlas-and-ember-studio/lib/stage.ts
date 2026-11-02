'use client';
/**
 * "Stage" gate: page intros wait until the preloader (first load) or the page-transition
 * curtain (client navigation) has lifted, so nothing animates hidden underneath an overlay.
 */
type Listener = () => void;
let open = false;
let listeners: Listener[] = [];

export const stage = {
  hold() {
    open = false;
  },
  release() {
    open = true;
    const l = listeners;
    listeners = [];
    l.forEach((fn) => fn());
  },
  /** Run fn once the stage is open. Returns an unsubscribe. */
  whenReady(fn: Listener) {
    if (open) {
      fn();
      return () => {};
    }
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((x) => x !== fn);
    };
  },
};
