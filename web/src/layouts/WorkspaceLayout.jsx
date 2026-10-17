import React, { useState } from 'react';
import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HelpDialog from '../shared/components/HelpDialog';
import { Menu, CircleHelp, PanelLeftClose } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';
import { navigation } from '../app/navigation';
import { groupedNavigation, visibleNavigation } from '../app/navigationGroups';

export default function WorkspaceLayout() {
  const { currentUser, authLoading, hasPermission } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chosenGroup, setChosenGroup] = useState(null);
  const groups = groupedNavigation(visibleNavigation(navigation, currentUser, hasPermission));
  const routeGroup = groups.find(group => group.entries.some(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
  // A manually opened/collapsed group belongs only to the current navigation entry.
  // Route changes (including Back/Forward) must not retain another page's menu.
  const selectionKey = `${location.key}:${location.pathname}`;
  const groupOverride = chosenGroup?.key === selectionKey ? chosenGroup.id : null;
  const selectedGroup = groupOverride === '' ? null : groups.find(group => group.id === groupOverride) || routeGroup;
  const selectGroup = id => setChosenGroup({ key: selectionKey, id });
  if (authLoading) return <div className="p-8">Đang xác thực…</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  const routeItem = navigation.filter(item => item.path !== '/app' && (location.pathname === item.path || location.pathname.startsWith(item.path + '/'))).sort((a,b) => b.path.length - a.path.length)[0];
  if (routeItem?.permission && !hasPermission(routeItem.permission)) return <Navigate to="/access-denied" replace />;
  if (!routeItem?.permission && ((location.pathname.startsWith('/manage') || location.pathname.startsWith('/admin')) && location.pathname !== '/admin/settings' && currentUser.role === 'learner')) return <Navigate to="/access-denied" replace />;
  return (
    <div className={`app-layout ${selectedGroup ? 'has-subnavigation' : ''}`}>
      <Sidebar selectedGroupId={selectedGroup?.id} onSelectGroup={selectGroup} open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onOpenHelp={() => setHelpOpen(true)} />
      {selectedGroup && <aside className="workspace-subnavigation" aria-label={selectedGroup.label}>
        <header><strong>{selectedGroup.label}</strong><button type="button" aria-label="Thu gọn menu con" onClick={() => selectGroup('')}><PanelLeftClose size={16} /></button></header>
        <nav aria-label="Menu chức năng">{selectedGroup.entries.map(item => { const Icon = item.icon; const active=location.pathname===item.path||location.pathname.startsWith(item.path+'/');return <Link key={item.id} to={item.path} aria-current={active?'page':undefined}><Icon size={16}/><span>{item.label}</span></Link> })}</nav>
        <footer>Goldsun Packaging · SkillHub</footer>
      </aside>}
      <div className="shell">
        <div className="md:hidden flex items-center justify-between px-4 h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Mở menu"><Menu size={20} /></button>
            <img src="/assets/goldsun/goldsun-icon.png" alt="Goldsun" className="w-5 h-5 object-contain" />
            <span className="font-bold text-emerald-800 dark:text-emerald-400 text-sm tracking-wide">Đánh giá năng lực MES</span>
          </div>
          <button onClick={() => setHelpOpen(true)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400" title="Trợ giúp"><CircleHelp size={18} /></button>
        </div>
        <div className="content-scroll workstation-no-scroll"><main id="main" className="content workstation-content"><Outlet /></main></div>
      </div>
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}


