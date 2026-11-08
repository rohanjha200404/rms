import { useEffect, useState } from 'react';
import { api } from '../services/api';
import NotificationBell from '../components/NotificationBell';

function Stat({ label, value, tone, onClick, active }) {
  return <button className={`stat-card ${tone} clickable ${active ? 'active' : ''}`} onClick={onClick}><span>{label}</span><strong>{value}</strong><small>{active ? 'Filter applied' : 'Click to filter'}</small></button>;
}

function dueBracket(days) {
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days <= 45) return '45 days';
  if (days <= 60) return '60 days';
  if (days <= 90) return '90 days';
  return '90+ days';
}

function PolicyDetails({ policy, onClose, onDisposition, notify }) {
  const [disposition, setDisposition] = useState(policy.disposition || '');
  const [showDisposition, setShowDisposition] = useState(false);
  const saveDisposition = async () => {
    try {
      await onDisposition(policy.id, disposition);
      notify('Disposition saved.');
      onClose();
    } catch (error) { notify(error.message, 'error'); }
  };
  const contact = (type) => {
    setShowDisposition(true);
    if (type === 'mail') notify('Customer email address is not available for this policy.', 'error');
    if (type === 'call') {
      notify('Customer phone number is not available for this policy.', 'error');
    }
  };
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="policy-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
      <div className="modal-heading"><div><p className="eyebrow">POLICY DETAILS</p><h2>{policy.name}</h2></div><button className="modal-close" onClick={onClose} aria-label="Close">×</button></div>
      <dl className="policy-details">
        <div><dt>Policy number</dt><dd>{policy.policyNo}</dd></div><div><dt>Start date</dt><dd>{policy.startDate || '—'}</dd></div>
        <div><dt>End date</dt><dd>{policy.endDate}</dd></div><div><dt>Amount</dt><dd>{policy.premium ? `₹${policy.premium}` : 'Not provided'}</dd></div>
        <div><dt>Agent</dt><dd>{policy.agentName || 'Unassigned'}</dd></div><div><dt>Disposition</dt><dd>{policy.disposition || 'Not provided'}</dd></div>
      </dl>
      <div className="policy-actions"><button onClick={() => contact('mail')}>✉ Send mail</button><button onClick={() => notify('Payment link is not configured for this policy.', 'error')}>₹ Make payment</button><button onClick={() => contact('call')}>☎ Call customer</button></div>
      {showDisposition && <div className="disposition-editor"><label>Disposition<input value={disposition} onChange={(event) => setDisposition(event.target.value)} placeholder="e.g. Spoke with customer; call back Friday" maxLength="255" /></label><button className="primary-button" onClick={saveDisposition}>Save disposition</button></div>}
    </section>
  </div>;
}

export default function Dashboard({ session, onLogout, notify }) {
  const [data, setData] = useState({ policies: [], counts: {}, pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 } });
  const [query, setQuery] = useState({ search: '', status: '', dueDays: '', page: 1 });
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const headers = { Authorization: `Bearer ${session.token}` };
  const load = async () => {
    try {
      const params = new URLSearchParams({ page: query.page, pageSize: 25, search: query.search, status: query.status, dueDays: query.dueDays });
      setData(await api(`/policies/summary?${params}`, { headers }));
    } catch (error) {
      if (error.message.includes('session has expired')) onLogout(); else notify(error.message, 'error');
    }
  };
  useEffect(() => { load(); }, [query]);
  const importSheet = async (event) => {
    const file = event.target.files[0]; if (!file) return;
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) notify('Please upload a CSV or Excel file.', 'error');
    else {
      const body = new FormData(); body.append('file', file);
      try { const result = await api('/policies/import', { method: 'POST', headers, body }); notify(`${result.imported} policies imported successfully.`); load(); }
      catch (error) { notify(error.message, 'error'); }
    }
    event.target.value = '';
  };
  const updateStatus = async (id, status) => {
    try { await api(`/policies/${id}/status`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); notify('Policy status updated.'); load(); }
    catch (error) { notify(error.message, 'error'); }
  };
  const updateDisposition = async (id, disposition) => {
    const result = await api(`/policies/${id}/disposition`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ disposition })
    });
    await load();
    return result;
  };
  const setFilter = (key, value) => setQuery((current) => ({ ...current, [key]: value, page: 1 }));
  const setDueFilter = (days) => setFilter('dueDays', query.dueDays === days ? '' : days);
  return <div className="app-shell"><header className="topbar"><div className="brand-inline"><div className="brand-mark small"><img src="/gs-logo.png" alt="" /></div><strong>GS Insurance</strong></div><div className="user-area"><NotificationBell notify={notify} /><span>Hi, {session.user.name.split(' ')[0]}</span><button className="ghost-button" onClick={onLogout}>Sign out</button></div></header>
    <main className="dashboard"><div className="dashboard-heading"><div><p className="eyebrow">RENEWAL OPERATIONS</p><h1>Good morning, {session.user.name.split(' ')[0]}.</h1><p className="subtitle">Here’s what needs your attention today.</p></div><div className="dashboard-actions"><label className="import-button">＋ Import sheet<input type="file" accept=".csv,.xlsx,.xls" onChange={importSheet} hidden /></label><a className="template-button" href="/policy-import-template.csv" download>↓ Download template</a></div></div>
      <div className="stat-grid"><Stat label="Total policies" value={data.counts.total || 0} tone="dark" onClick={() => setDueFilter('')} active={!query.dueDays} /><Stat label="Due in 45 days" value={data.counts.due45 || 0} tone="amber" onClick={() => setDueFilter('45')} active={query.dueDays === '45'} /><Stat label="Due in 60 days" value={data.counts.due60 || 0} tone="green" onClick={() => setDueFilter('60')} active={query.dueDays === '60'} /><Stat label="Due in 90 days" value={data.counts.due90 || 0} tone="green" onClick={() => setDueFilter('90')} active={query.dueDays === '90'} /><Stat label="Lapsed" value={data.counts.lapsed || 0} tone="rose" onClick={() => setFilter('status', query.status === 'lapsed' ? '' : 'lapsed')} active={query.status === 'lapsed'} /></div>
      <section className="table-card"><div className="section-heading"><div><h2>Policy renewals</h2><p>Search, filter, and manage your customer portfolio.</p></div><span className="record-count">{data.pagination.total} records</span></div>
        <div className="table-toolbar"><input aria-label="Search policies" placeholder="Search customer or policy number" value={query.search} onChange={(event) => setFilter('search', event.target.value)} /><select aria-label="Filter by due window" value={query.dueDays} onChange={(event) => setFilter('dueDays', event.target.value)}><option value="">All due windows</option><option value="45">Due in 45 days</option><option value="60">Due in 60 days</option><option value="90">Due in 90 days</option></select><select aria-label="Filter by status" value={query.status} onChange={(event) => setFilter('status', event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="quoted">Quoted</option><option value="renewed">Renewed</option><option value="lapsed">Lapsed</option></select></div>
        <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Policy number</th><th>Due in</th><th>Renewal date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{data.policies.length ? data.policies.map((policy) => <tr key={policy.id}><td><strong>{policy.name}</strong></td><td>{policy.policyNo}</td><td><span className={policy.daysToRenewal < 0 ? 'date overdue' : ''}>{dueBracket(policy.daysToRenewal)}</span></td><td>{policy.endDate}</td><td><select value={policy.status} onChange={(event) => updateStatus(policy.id, event.target.value)} className={`status ${policy.status}`}><option value="pending">Pending</option><option value="quoted">Quoted</option><option value="renewed">Renewed</option><option value="lapsed">Lapsed</option></select></td><td><button className="more-button" onClick={() => setSelectedPolicy(policy)} aria-label={`Open actions for ${policy.name}`}>•••</button></td></tr>) : <tr><td colSpan="6" className="empty">No policies match your search.</td></tr>}</tbody></table></div>
        <div className="pagination"><button disabled={query.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {data.pagination.page} of {data.pagination.totalPages}</span><button disabled={query.page >= data.pagination.totalPages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div>
      </section></main><footer>For any queries, call <a href="tel:79827737082">79827737082</a> or email <a href="mailto:imrohanjha001@gmail.com">imrohanjha001@gmail.com</a></footer>{selectedPolicy && <PolicyDetails policy={selectedPolicy} onClose={() => setSelectedPolicy(null)} onDisposition={updateDisposition} notify={notify} />}
  </div>;
}
