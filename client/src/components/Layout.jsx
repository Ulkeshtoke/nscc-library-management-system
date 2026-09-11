import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  QrCode,
  History,
  Printer,
  Library,
  Users,
  Menu,
  X,
  Database,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';

export default function Layout({ activeTab, setActiveTab, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSystemHealthy, setIsSystemHealthy] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        setIsSystemHealthy(res.status === 'ok');
      })
      .catch(() => {
        setIsSystemHealthy(false);
      });
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books & Copies', icon: BookOpen },
    { id: 'scan', label: 'Issue & Return (QR)', icon: QrCode },
    { id: 'history', label: 'Transaction History', icon: History },
    { id: 'members', label: 'Member Management', icon: Users },
    { id: 'labels', label: 'Print QR Labels', icon: Printer },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-100/75 text-slate-900 font-sans antialiased">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none no-print">
        {/* Branding */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">University Library</span>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                LMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Circulation System</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Circulation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer System State */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-300">Database Connected</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Database className="w-3 h-3" /> MongoDB Atlas Synchronized
          </p>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-64 max-w-xs bg-slate-900 text-slate-300 flex flex-col h-full z-10 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Library className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white">Library System</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="lg:hidden flex items-center gap-2">
              <Library className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-sm text-slate-900">Library System</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-500">Circulation Desk</span>
              <span className="text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 font-medium">
                Central Campus
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <span className={`w-2 h-2 rounded-full ${isSystemHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="font-medium text-slate-700">
                {isSystemHealthy ? 'System Operational' : 'Connecting...'}
              </span>
            </div>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Clean Institutional Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="font-semibold text-slate-800">Library Management System</span>
            <span className="text-slate-300">|</span>
            <span>Book Issue &amp; Return Management</span>
          </div>
          <div className="text-slate-500 flex items-center gap-2 text-[11px]">
            <span>MERN Stack</span>
            <span>&bull;</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
