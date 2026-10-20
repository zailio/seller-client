'use client';
import { useId } from 'react';
import { Field, st } from './controls';
import { toLocalInput, fromLocalInput } from '../lib/utils';

export default function DateTime({ label, hint, value, onChange }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input id={id} type="datetime-local" className={st.input} value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />
    </Field>
  );
}
