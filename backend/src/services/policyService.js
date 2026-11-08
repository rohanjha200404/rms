const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const { dateValue, daysUntil } = require('../utils/date');

function createPolicyService({ policyRepository }) {
  async function summary({ page = 1, pageSize = 25, search = '', status = '', dueDays = '' } = {}) {
  const result = await policyRepository.findRenewals({ page, pageSize, search, status, dueDays });
  const policies = result.rows;
  const withDays = policies.map((policy) => {
    const value = policy.toJSON();
    return { ...value, status: value.status.toLowerCase(), daysToRenewal: daysUntil(policy.endDate) };
  });
  const allDates = await policyRepository.findRenewalDates();
  const allDays = allDates.map(({ endDate }) => daysUntil(endDate));
  const due = (min, max) => allDays.filter((daysToRenewal) => daysToRenewal > min && daysToRenewal <= max).length;
  const counts = await policyRepository.counts();
  return {
    policies: withDays,
    counts: { ...counts, due45: due(-1, 45), due60: due(45, 60), due90: due(60, 90) },
    pagination: { page, pageSize, total: result.count, totalPages: Math.max(1, Math.ceil(result.count / pageSize)) }
  };
  }

  async function importCsv(file, userId) {
  const fileName = file?.originalname?.toLowerCase() || '';
  const isCsv = fileName.endsWith('.csv');
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
  if (!file || (!isCsv && !isExcel)) {
    const error = new Error('Please upload a CSV or Excel file (.csv, .xlsx, or .xls).');
    error.status = 400;
    throw error;
  }
  let normalizedHeaders = [];
  const normalizeHeader = (header) => String(header || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s*\(yyyy\s*[/-]\s*mm\s*[/-]\s*dd\)\s*$/, '')
    .replace(/\s+/g, ' ');
  let records;
  if (isExcel) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false }) : [];
    normalizedHeaders = (rows.shift() || []).map(normalizeHeader);
    records = rows.filter((row) => row.some((value) => String(value).trim()))
      .map((row) => normalizedHeaders.reduce((record, header, index) => {
        record[header] = row[index] ?? '';
        return record;
      }, {}));
  } else {
    const csvText = file.buffer.toString('utf8').replace(/^\uFEFF/, '');
    const firstDataLine = csvText.split(/\r?\n/).find((line) => line.trim() && !line.trim().startsWith('#')) || '';
    const delimiter = firstDataLine.includes(';') && !firstDataLine.includes(',') ? ';' : ',';
    records = parse(csvText, {
      bom: true,
      delimiter,
      columns: (headers) => {
        normalizedHeaders = headers.map(normalizeHeader);
        return normalizedHeaders;
      },
      comment: '#',
      skip_empty_lines: true,
      trim: true
    });
  }
  const required = ['name', 'policy no', 'policy end date', 'policy start date', 'dob of customer'];
  const missing = required.filter((header) => !normalizedHeaders.includes(header));
  if (missing.length) {
    const error = new Error(`Missing required columns: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
  }
  if (!records.length) {
    const error = new Error('The sheet has headers but no policy rows. Add at least one policy and try again.');
    error.status = 400;
    throw error;
  }
  const policies = records.map((row, index) => {
    const rowNumber = index + 2;
    if (!row.name) throw Object.assign(new Error(`Row ${rowNumber}: customer name is required.`), { status: 400 });
    if (!row['policy no']) throw Object.assign(new Error(`Row ${rowNumber}: policy number is required.`), { status: 400 });
    try {
      return {
        name: String(row.name).trim(),
        policyNo: String(row['policy no']).trim(),
        endDate: dateValue(row['policy end date']),
        startDate: dateValue(row['policy start date']),
        customerDob: dateValue(row['dob of customer']),
        plan: 'Renewal policy',
        premium: 0
      };
    } catch (error) {
      throw Object.assign(new Error(`Row ${rowNumber}: ${error.message}`), { status: 400 });
    }
  });
  const { existingByNumber } = await policyRepository.upsertMany(policies);
  const notifications = policies.map((policy) => {
    const previous = existingByNumber.get(policy.policyNo);
    if (!previous) return {
      userId, type: 'policy_added', title: 'New policy added',
      message: `${policy.name} (${policy.policyNo}) was added to renewals.`,
      policyNo: policy.policyNo
    };
    if (previous && String(previous.endDate).slice(0, 10) !== policy.endDate) return {
      userId, type: 'date_changed', title: 'Renewal date changed',
      message: `${policy.policyNo} renewal moved from ${previous.endDate} to ${policy.endDate}.`,
      policyNo: policy.policyNo
    };
    return null;
  }).filter(Boolean);
  if (notifications.length) await policyRepository.createNotifications(notifications);
  return { imported: policies.length };
  }

  async function updateStatus(id, status) {
  if (!['pending', 'quoted', 'renewed', 'lapsed'].includes(status)) {
    const error = new Error('Invalid policy status.');
    error.status = 400;
    throw error;
  }
  const [updated] = await policyRepository.updateStatus(id, status.charAt(0).toUpperCase() + status.slice(1));
  if (!updated) {
    const error = new Error('Policy not found.');
    error.status = 404;
    throw error;
  }
  }

  async function updateDisposition(id, disposition) {
  const value = String(disposition || '').trim();
  if (value.length > 255) {
    const error = new Error('Disposition must be 255 characters or fewer.');
    error.status = 400;
    throw error;
  }
  const [updated] = await policyRepository.updateDisposition(id, value || null);
  if (!updated) {
    const error = new Error('Policy not found.');
    error.status = 404;
    throw error;
  }
  }

  return { summary, importCsv, updateStatus, updateDisposition };
}

module.exports = { createPolicyService };
