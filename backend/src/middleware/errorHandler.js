function errorHandler(error, _req, res, _next) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Import failed: the CSV file is larger than the 5 MB limit.' });
  }
  if (error.code === 'CSV_INVALID_RECORD_LENGTH') {
    return res.status(400).json({ message: `Import failed: row ${error.lines || 'unknown'} has a different number of columns than the header.` });
  }
  if (error.code === 'CSV_INVALID_COLUMN_MAPPING') {
    return res.status(400).json({ message: 'Import failed: the CSV columns could not be matched to the template.' });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: `Import failed: ${error.errors.map(({ message }) => message).join('; ')}` });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    const policyDuplicate = error.errors?.some(({ path }) => path === 'policyNo' || path === 'policy_number');
    return res.status(409).json({ message: policyDuplicate ? 'Import failed: one or more policy numbers already exist and could not be updated.' : 'An account with this email already exists.' });
  }
  const status = error.status || 500;
  res.status(status).json({ message: status === 500 ? 'Import failed: the server could not save the spreadsheet. Check the database connection and try again.' : `Import failed: ${error.message}` });
}

module.exports = { errorHandler };
