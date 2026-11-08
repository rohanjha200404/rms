export default function Captcha({ value, onChange, refresh }) {
  return <div className="captcha-row">
    <div className="captcha-question">{value.question}</div>
    <input value={value.answer || ''} onChange={(event) => onChange(event.target.value)} placeholder="Answer" aria-label="CAPTCHA answer" />
    <button type="button" className="icon-button" onClick={refresh} aria-label="Refresh CAPTCHA">↻</button>
  </div>;
}
