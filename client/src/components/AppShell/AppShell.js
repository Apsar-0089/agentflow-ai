import React, { useState, useEffect } from 'react';
import Link from 'next/router';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Sparkles,
  GitFork,
  Activity,
  Boxes,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Radio,
  CheckCheck,
  X,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { notificationApi } from '../../services/api';
import { getSocket } from '../../services/socket';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Builder', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
  { name: 'Workflows', href: '/workflows', icon: GitFork },
  { name: 'Executions', href: '/executions', icon: Activity },
  { name: 'Integrations', href: '/integrations', icon: Boxes },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function AppShell({ children, title, subtitle, actions }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications(20);
      if (res?.data) {
        setNotifications(res.data);
        const unread = res.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for live socket notifications
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification:broadcast', handleNewNotification);

      return () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification:broadcast', handleNewNotification);
      };
    }
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // Non-blocking
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex text-slate-100 antialiased overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-surfaceBorder flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-surfaceBorder bg-slate-950/40">
          <NextLink href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-cyan flex items-center justify-center shadow-glow-brand group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Agentflow<span className="text-brand-cyan font-mono">_AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block -mt-1 tracking-wider uppercase">
                Ops Console v1.0
              </span>
            </div>
          </NextLink>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live System Substrate Pill */}
        <div className="px-4 py-3 border-b border-surfaceBorder/60 bg-slate-900/30">
          <div className="flex items-center justify-between text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-surfaceBorder">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
              <span>Orchestrator Online</span>
            </div>
            <span className="text-[10px] text-brand-400 bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-800/40">
              LangGraph
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            return (
              <NextLink
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-surfaceLight/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-cyan border border-brand-500/30 font-mono">
                    {item.badge}
                  </span>
                )}
              </NextLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-surfaceBorder bg-slate-950/40">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-surfaceBorder/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'AI Operator'}</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-brand-cyan" />
                  <span className="text-[10px] text-slate-400 font-mono uppercase truncate">
                    {user?.role || 'operator'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="h-16 px-6 bg-surface/80 backdrop-blur-md border-b border-surfaceBorder sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-surfaceLight text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>Console</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-brand-300 font-sans font-semibold">{title || 'Overview'}</span>
              </div>
              {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-3">
            {actions}

            {/* Notification Bell */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-surfaceLight/60 hover:bg-surfaceLight text-slate-300 hover:text-white border border-surfaceBorder transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-glow-brand animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">{children}</main>
      </div>

      {/* Notifications Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-surface border-l border-surfaceBorder shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 border-b border-surfaceBorder flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Operations Feed</h3>
                    <p className="text-[11px] text-slate-400">Real-time alerts & agent actions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Radio className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n, idx) => (
                    <div
                      key={n._id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        n.isRead
                          ? 'bg-slate-900/40 border-surfaceBorder/60 text-slate-400'
                          : 'bg-surfaceLight/60 border-brand-500/30 text-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              n.type === 'success'
                                ? 'bg-emerald-400'
                                : n.type === 'failure' || n.type === 'escalation'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          <h4 className="text-xs font-semibold text-slate-100">{n.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{n.message}</p>
                      {n.executionId && (
                        <NextLink
                          href={`/executions/${n.executionId._id || n.executionId}`}
                          className="inline-flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 font-mono mt-2"
                        >
                          <span>Inspect Execution Run</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </NextLink>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
