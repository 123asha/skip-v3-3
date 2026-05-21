import { useState } from 'react';
import s from '../App.module.css';

const tools = [
  { name: 'Конструктор', desc: 'Разбираем архитектуру бренда до основания.', year: '2026' },
  { name: 'Метод', desc: 'Строим визуальные системы с нуля.', year: '2026' },
  { name: 'Решение', desc: 'Ведём проект от первого брифа до релиза.', year: '2026' },
];

export function ToolsList({ toolsRowsRef }: { toolsRowsRef?: React.RefObject<HTMLDivElement> | null }) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  return (
    <div ref={toolsRowsRef ?? undefined} className={s.toolsList}>
      {tools.map(tool => (
        <div
          key={tool.name}
          className={s.toolRow}
          style={{
            borderTopColor: hoveredTool === tool.name ? 'var(--c-text)' : undefined,
            cursor: 'pointer',
            transition: 'border-top-color 0.2s ease',
          }}
          onMouseEnter={() => setHoveredTool(tool.name)}
          onMouseLeave={() => setHoveredTool(null)}
        >
          <p className={s.toolRowText}>{tool.name}</p>
          <div />
          <p className={s.toolRowText}>{tool.desc}{' '}<span className={s.toolRowLink}>Читать</span></p>
          <div />
          <p className={`${s.toolRowText} ${s.toolRowTextRight}`}>{tool.year}</p>
        </div>
      ))}
    </div>
  );
}

export function MediaSection({ toolsRowsRef }: { toolsRowsRef?: React.RefObject<HTMLDivElement> | null }) {
  return (
    <div className={s.section}>
      <div className={s.tools}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--h2-size)',
          fontWeight: 'var(--h2-weight)' as React.CSSProperties['fontWeight'],
          lineHeight: 'var(--h2-lh)',
          letterSpacing: 'var(--h2-ls)',
          color: 'var(--c-text)',
          margin: 0,
        }}>Медиа</h2>
        <ToolsList toolsRowsRef={toolsRowsRef} />
      </div>
    </div>
  );
}
