import { getIn, setIn } from '../lib/utils';

/** bind(path) -> { value, onChange } wired to the history store (edits to one path merge in undo). */
export function makeBind(cfg, edit) {
  return (path) => ({
    value: getIn(cfg, path, ''),
    onChange: (v) => edit((c) => setIn(c, path, v), path),
  });
}
