'use client';

import { useCallback, useRef, useState } from 'react';
import { clone } from './utils';

const LIMIT = 100;

/**
 * Config state with undo / redo.
 *  commit(mutator, { key }) – mutator edits a deep clone; edits sharing a `key`
 *  within 900 ms merge into one history step (typing, sliders).
 */
export function useHistory(initialConfig) {
  const init = { config: initialConfig, past: [], future: [] };
  const [snap, setSnap] = useState(init);
  const ref = useRef(init);
  const last = useRef({ key: null, t: 0 });

  const apply = useCallback((next) => {
    ref.current = next;
    setSnap(next);
  }, []);

  const commit = useCallback((mutator, opts = {}) => {
    const s = ref.current;
    const next = clone(s.config);
    mutator(next);
    const now = Date.now();
    const merge = !!opts.key && last.current.key === opts.key && now - last.current.t < 900;
    last.current = { key: opts.key || null, t: now };
    apply({ config: next, past: merge ? s.past : [...s.past, s.config].slice(-LIMIT), future: [] });
  }, [apply]);

  const undo = useCallback(() => {
    const s = ref.current;
    if (!s.past.length) return;
    last.current = { key: null, t: 0 };
    apply({ config: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.config, ...s.future] });
  }, [apply]);

  const redo = useCallback(() => {
    const s = ref.current;
    if (!s.future.length) return;
    last.current = { key: null, t: 0 };
    apply({ config: s.future[0], past: [...s.past, s.config], future: s.future.slice(1) });
  }, [apply]);

  const reset = useCallback((config) => {
    last.current = { key: null, t: 0 };
    apply({ config, past: [], future: [] });
  }, [apply]);

  return { config: snap.config, commit, undo, redo, reset, canUndo: snap.past.length > 0, canRedo: snap.future.length > 0 };
}
