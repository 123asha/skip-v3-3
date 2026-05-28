import { useRef, useState } from 'react';
import s from './PillInput.module.css';

/**
 * PillInput — single fully-rounded input field with an optional prefix circle.
 * Used by ContactForm for email + telegram. Replaces the per-letter CircleInput
 * for these simpler contact fields.
 *
 * Visual: [@] [──────── telegram ───────────]
 *          ↑   ↑
 *      prefix  pill input with placeholder
 *
 *   For email: omit prefix; the pill renders alone.
 */
export default function PillInput({
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  prefix,
  action,
  error,
  size = 44,
  disabled,
}: {
  placeholder: string;
  value?: string;
  onChange?: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  prefix?: string;
  action?: React.ReactNode;
  error?: boolean;
  size?: number;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isControlled = onChange !== undefined;
  const [ownValue, setOwnValue] = useState('');
  const [focused, setFocused] = useState(false);
  const v = isControlled ? (value ?? '') : ownValue;

  return (
    <div
      className={`${s.root} ${focused ? s.focused : ''} ${error ? s.error : ''}`}
      style={{ ['--pill-h' as never]: `${size}px`, opacity: disabled ? 0.35 : 1, pointerEvents: disabled ? 'none' : undefined }}
      onClick={() => inputRef.current?.focus()}
    >
      {prefix && <div className={s.prefix}>{prefix}</div>}
      <div className={s.field}>
        <input
          ref={inputRef}
          type="text"
          value={v}
          onChange={e => isControlled ? onChange!(e.target.value) : setOwnValue(e.target.value)}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={disabled}
        />
        {action && <div className={s.action}>{action}</div>}
      </div>
    </div>
  );
}
