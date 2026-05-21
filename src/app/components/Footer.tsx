import s from './Footer.module.css';

export default function Footer() {
  return (
    <div className={s.footer}>
      <a href="https://t.me/skipbot" target="_blank" rel="noreferrer">телеграм</a>
      <a href="mailto:hi@skip.design">hi@skip.design</a>
    </div>
  );
}
