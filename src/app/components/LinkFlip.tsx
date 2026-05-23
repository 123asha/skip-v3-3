import type { ReactNode } from 'react';
import s from './LinkFlip.module.css';

/**
 * Wraps a piece of text in a 2-face 3D "cube". The front face shows the
 * original text; the bottom face is a hidden duplicate. On :hover the inner
 * element rotates +90° around X — the front face becomes the (invisible)
 * top, and the bottom face rotates up to the front.
 *
 * Typography (font, colour, text-decoration) is inherited from the parent,
 * so the project's existing dotted underline keeps working without any
 * extra styling here.
 */
export default function LinkFlip({ children }: { children: ReactNode }) {
  return (
    <span className={s.wrap}>
      <span className={s.inner}>
        <span className={s.front}>{children}</span>
        <span className={s.bottom} aria-hidden="true">{children}</span>
      </span>
    </span>
  );
}
