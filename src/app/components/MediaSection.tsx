import { useState } from 'react';
import s from '../App.module.css';
import { MagneticDivider } from './MagneticDivider';

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
          style={{ cursor: 'pointer', position: 'relative' }}
          onMouseEnter={() => setHoveredTool(tool.name)}
          onMouseLeave={() => setHoveredTool(null)}
        >
          <MagneticDivider active={hoveredTool === tool.name} />
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
          fontSize: 'var(--heading-size)',
          fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
          lineHeight: 'var(--heading-lh)',
          letterSpacing: 'var(--heading-ls)',
          color: 'var(--c-text)',
          margin: 0,
        }}>Медиа</h2>
        <ToolsList toolsRowsRef={toolsRowsRef} />
      </div>
    </div>
  );
}
