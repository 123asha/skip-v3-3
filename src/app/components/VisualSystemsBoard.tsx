import { useEffect, useState } from 'react';

const IMGS = [
  'https://cdn.prod.website-files.com/675f094fa71fc3ba49590b83/68dd523f3242f983fe4bcef5_main%20ae.png',
  'https://cdn.prod.website-files.com/675f094fa71fc3ba49590b83/68dd57358ebd2acb0ec91f25_ae%201.1.png',
  'https://cdn.prod.website-files.com/675f094fa71fc3ba49590b83/68ab337ce793eadbdb71c93b_ae7.png',
];

export default function VisualSystemsBoard() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % IMGS.length), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {IMGS.map((src, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: idx === i ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      ))}
    </div>
  );
}
