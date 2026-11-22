import { useState, type ReactNode } from 'react';
import type { Page } from '../types';
import { Icon } from './UI';

const mainNav = [
  ['overview', 'home', 'Overview'], ['setup', 'plus', 'New Interview'], ['history', 'history', 'Interview History'], ['performance', 'chart', 'Performance'],
] as const;
const bottomNav = [['settings', 'settings', 'Settings'], ['help', 'help', 'Help & Feedback']] as const;

export function AppShell({ page, onNavigate, children }: { page: Page; onNavigate: (p: Page) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = (p: Page) => { onNavigate(p); setOpen(false); };
  return (
    <div className="app-shell">
      <button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
      {open && <button className="drawer-backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><span /></div><div><strong>InterviewAI</strong><small>Practice smarter</small></div><button className="drawer-close" onClick={()=>setOpen(false)}><Icon name="close" /></button></div>
        <nav>
          <span className="nav-label">WORKSPACE</span>
          {mainNav.map(([id, icon, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span>{page === id && <i />}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <nav>{bottomNav.map(([id, icon, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)}><Icon name={icon} /><span>{label}</span></button>)}</nav>
          <button className="profile"><span className="avatar">AM</span><span><strong>Alex Morgan</strong><small>Interview Candidate</small></span><Icon name="chevron" size={16} /></button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
