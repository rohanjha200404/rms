function dateValue(value) {
  const normalized = String(value || '').trim().replace(/^\uFEFF/, '');
  if (/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split(/[/-]/);
    if (Number(month) <= 12 && Number(day) <= 31) return `${year}-${month}-${day}`;
  }
  const slashDate = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    const [, first, second, year] = slashDate;
    const month = Number(first);
    const day = Number(second);
    if (month <= 12 && day <= 31) return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  throw new Error(`Invalid date "${normalized}". Use YYYY/MM/DD (for example 2026/12/15).`);
}

function daysUntil(date, today = new Date()) {
  return Math.ceil((new Date(date) - today) / 86400000);
}

module.exports = { dateValue, daysUntil };
