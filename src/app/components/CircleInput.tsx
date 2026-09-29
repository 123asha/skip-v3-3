import { useState, useRef } from 'react';
import s from './CircleInput.module.css';
import { t } from '../i18n';

interface CircleInputProps {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Circle diameter — px, or any CSS length (e.g. a width-derived calc) */
  size?: number | string;
  disabled?: boolean;
  action?: React.ReactNode;
  error?: boolean;
  maxLength?: number;
  /** Circle that always stays first (e.g. "@" or an icon) — not part of the value */
  prefix?: React.ReactNode;
  /** At rest show the blinking caret circle instead of the placeholder
   *  letters (the placeholder stays as the field's aria-label) */
  caretAtRest?: boolean;
}

export default function CircleInput({ placeholder, value: externalValue, onChange, onFocus: onFocusProp, onBlur: onBlurProp, size = 120, disabled, action, error, maxLength, prefix, caretAtRest }: CircleInputProps) {
  const isControlled = onChange !== undefined;
  const [ownValue, setOwnValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const value = isControlled ? (externalValue ?? '') : ownValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isControlled) onChange!(e.target.value);
    else setOwnValue(e.target.value);
  };

  const isEditing = focused || value.length > 0;
  const chars = Array.from(value);

  return (
    <div
      className={`${s.root} ${isEditing ? s.focused : ''} ${focused ? s.hasFocus : ''} ${caretAtRest ? s.caretAtRest : ''} ${error ? s.error : ''}`}
      style={{
        '--c-size': typeof size === 'number' ? `${size}px` : size,
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: disabled ? 'none' : undefined,
      } as React.CSSProperties}
      // preventDefault keeps the browser from moving focus to <body> on
      // mousedown — without it a click on the circles never reaches the input
      // and the submit arrow (which waits for focus) never appears.
      onMouseDown={e => { e.preventDefault(); inputRef.current?.focus(); }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Fixed first circle — stays put, typing starts after it */}
      {prefix && <div className={`${s.circle} ${s.prefix}`}>{prefix}</div>}

      {/* Placeholder stays mounted and collapses away, so the row of circles
          shrinks smoothly instead of snapping when the field is focused. */}
      {!caretAtRest && Array.from(t(placeholder)).map((ch, i) => (
        <div
          key={`p-${i}`}
          className={`${s.circle} ${s.placeholder} ${isEditing ? s.collapsed : ''}`}
          style={{ transitionDelay: isEditing ? `${i * 0.022}s` : `${(placeholder.length - 1 - i) * 0.02}s` }}
        >{ch}</div>
      ))}

      {/* Caret-at-rest fields keep the caret circle for good — always the
          last circle, after the typed letters, focused or not; the submit
          arrow follows it */}
      {caretAtRest && (
        <>
          {chars.map((ch, i) => (
            <div key={`${ch}-${i}`} className={`${s.circle} ${s.typed}`}>{ch}</div>
          ))}
          <div className={`${s.circle} ${s.cursor}`}>
            <span className={s.caret}>|</span>
          </div>
          {action}
        </>
      )}
      {!caretAtRest && isEditing && (
        <>
          {chars.map((ch, i) => (
            <div key={`${ch}-${i}`} className={`${s.circle} ${s.typed}`}>{ch}</div>
          ))}
          {/* Inline action (arrow button) after last char — replaces cursor when present */}
          {action}
          {focused && !action && (
            <div className={`${s.circle} ${s.cursor}`}>
              <span className={s.caret}>|</span>
            </div>
          )}
        </>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => { setFocused(true); onFocusProp?.(); }}
        onBlur={() => { setFocused(false); onBlurProp?.(); }}
        className={s.hiddenInput}
        aria-label={placeholder}
        disabled={disabled}
        maxLength={maxLength}
      />
    </div>
  );
}
