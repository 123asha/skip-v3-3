import { useState, useEffect } from 'react';
import s from '../App.module.css';

function fmt() {
  return new Intl.DateTimeFormat('ru', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export default function MoscowTime() {
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);
  // Replace the literal ":" with a slow-blinking span (one cycle per 2 s)
  const parts = time.split(':');
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className={s.timeColon}>:</span>}
        </span>
      ))}
    </>
  );
}
