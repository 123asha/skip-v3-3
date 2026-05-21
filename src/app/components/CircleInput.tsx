import { useState, useRef } from 'react';
import s from './CircleInput.module.css';

interface CircleInputProps {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  size?: number;
  disabled?: boolean;
  action?: React.ReactNode;
  error?: boolean;
}

export default function CircleInput({ placeholder, value: externalValue, onChange, onFocus: onFocusProp, onBlur: onBlurProp, size = 120, disabled, action, error }: CircleInputProps) {
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
      className={`${s.root} ${isEditing ? s.focused : ''} ${error ? s.error : ''}`}
      style={{
        '--c-size': `${size}px`,
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: disabled ? 'none' : undefined,
      } as React.CSSProperties}
      onClick={() => inputRef.current?.focus()}
    >
      {isEditing ? (
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
      ) : (
        Array.from(placeholder).map((ch, i) => (
          <div key={i} className={`${s.circle} ${s.placeholder}`}>{ch}</div>
        ))
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
      />
    </div>
  );
}
