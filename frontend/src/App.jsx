import { useState } from 'react';
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import Toast from './components/Toast';

export default function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('gs-session') || 'null'));
  const [toast, setToast] = useState(null);
  const notify = (message, type = 'success') => setToast({ message, type });
  const login = (value) => { localStorage.setItem('gs-session', JSON.stringify(value)); setSession(value); };
  const logout = () => { localStorage.removeItem('gs-session'); setSession(null); };
  return <>
    {session ? <Dashboard session={session} onLogout={logout} notify={notify} /> : <Auth onLogin={login} notify={notify} />}
    <Toast toast={toast} onDismiss={() => setToast(null)} />
  </>;
}
