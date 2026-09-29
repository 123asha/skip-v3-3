import { useState, useRef, useEffect } from 'react';
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
  /** Enter pressed in the field */
  onSubmit?: () => void;
}

export default function CircleInput({ placeholder, value: externalValue, onChange, onFocus: onFocusProp, onBlur: onBlurProp, size = 120, disabled, action, error, maxLength, prefix, caretAtRest, onSubmit }: CircleInputProps) {
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

  // ── Selection, like plain text ────────────────────────────────────────
  // The real <input> is hidden, so its selection is mirrored onto the
  // circles (selected ones fill in). Dragging across the circles, a double
  // click, Shift+arrows and Cmd+A all select; copy, delete and typing over a
  // selection are the input's own.
  const [sel, setSel] = useState<[number, number]>([0, 0]);
  const syncSel = () => {
    const el = inputRef.current;
    if (el) setSel([el.selectionStart ?? 0, el.selectionEnd ?? 0]);
  };
  useEffect(syncSel, [value]);
  const dragFrom = useRef<number | null>(null);
  // Caret position under the pointer: before or after the circle it's over
  const posAt = (x: number, y: number) => {
    const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-ci]');
    if (!hit) return chars.length;
    const i = Number(hit.dataset.ci);
    const r = hit.getBoundingClientRect();
    return x > r.left + r.width / 2 ? i + 1 : i;
  };
  const select = (a: number, b: number) => {
    const el = inputRef.current;
    if (!el) return;
    el.setSelectionRange(Math.min(a, b), Math.max(a, b), b < a ? 'backward' : 'forward');
    syncSel();
  };
  useEffect(() => {
    if (!caretAtRest) return;
    const onMove = (e: MouseEvent) => { if (dragFrom.current !== null) select(dragFrom.current, posAt(e.clientX, e.clientY)); };
    const onUp = () => { dragFrom.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  });

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
      onMouseDown={e => {
        e.preventDefault();
        inputRef.current?.focus();
        if (caretAtRest) {
          const pos = posAt(e.clientX, e.clientY);
          dragFrom.current = pos;
          select(pos, pos);
        }
      }}
      onDoubleClick={caretAtRest ? () => select(0, chars.length) : undefined}
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
            <div
              key={`${ch}-${i}`} data-ci={i}
              className={`${s.circle} ${s.typed} ${focused && i >= sel[0] && i < sel[1] ? s.selected : ''}`}
            >{ch}</div>
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
        onSelect={syncSel}
        onKeyUp={syncSel}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit?.(); } }}
        onBlur={() => { setFocused(false); onBlurProp?.(); }}
        className={s.hiddenInput}
        aria-label={placeholder}
        disabled={disabled}
        maxLength={maxLength}
      />
    </div>
  );
}
