import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Map as MapIcon, ShieldAlert, Activity,
  Bell, User, Menu, AlertTriangle, Wind, Settings, X, Github, Mail, Globe,
  ChevronRight, LogOut, Users, BrainCircuit, ClipboardList, Trophy
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Safety from './pages/Safety';
import Dispatch from './pages/Dispatch';
import ManageUsers from './pages/ManageUsers';
import CleanerResolve from './pages/CleanerResolve';

import PredictiveMaintenance from './pages/PredictiveMaintenance';
import FeedbackPortal from './pages/FeedbackPortal';
import UnifiedQR from './pages/UnifiedQR';
import Leaderboard from './pages/Leaderboard';
import WashroomFinder from './pages/WashroomFinder';

/* ───────────────────── Protected Route Wrapper ───────────────────── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading CivicSync...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* ───────────────────── App Content ───────────────────── */
function AppContent() {
  const [washrooms, setWashrooms] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/sensors/status');
      setWashrooms(res.data);
    } catch (error: any) {
      // If 401, token expired — logout
      if (error.response?.status === 401) {
        logout();
      }
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalFacilities = Math.max(1, washrooms.length);
  const activeAlerts = washrooms.filter(w => w.status === 'Red').length;
  const maintenance = washrooms.filter(w => w.status === 'Yellow').length;

  const toggleNotif = () => { setShowNotif(!showNotif); setShowProfile(false); };
  const toggleProfile = () => { setShowProfile(!showProfile); setShowNotif(false); };

  const pageTitles: Record<string, string> = {
    '/': 'Admin Dashboard',
    '/map': 'Live Map',
    '/safety': 'Safety Monitoring',
    '/dispatch': 'Issue Tracker',
    '/predictive': 'Predictive Maintenance',
    '/manage-users': 'Access Control',
    '/leaderboard': 'Leaderboard',
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">

      {/* ──── Mobile Sidebar Overlay ──── */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileSidebar(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        </div>
      )}

      {/* ──── SIDEBAR ──── */}
      <aside className={`
        fixed md:relative z-50 md:z-auto 
        bg-white border-r border-slate-200/80
        transition-all duration-300 flex flex-col h-full
        ${mobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarOpen ? 'w-64' : 'w-[72px]'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between border-b border-slate-100 px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-black text-lg tracking-tight text-slate-900 truncate">
                Civic<span className="text-blue-600">Sync</span>
              </span>
            )}
          </div>
          <button onClick={() => setMobileSidebar(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarOpen && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Navigation
            </p>
          )}
          <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" currentPath={location.pathname} sidebarOpen={sidebarOpen} />

          {/* Only Super Admin gets city map and safety pages */}
          {isAdmin && (
            <>
              <NavItem to="/map" icon={<MapIcon />} label="Live Map" currentPath={location.pathname} sidebarOpen={sidebarOpen} />
              <NavItem to="/safety" icon={<ShieldAlert />} label="Safety Monitoring" currentPath={location.pathname} sidebarOpen={sidebarOpen} alert={activeAlerts > 0} />
            </>
          )}

          {/* Dispatch / Issue Tracker & AI Predictions — Nodal Officers only */}
          {!isAdmin && (
            <>
              <NavItem to="/dispatch" icon={<ClipboardList />} label="Issue Tracker" currentPath={location.pathname} sidebarOpen={sidebarOpen} badge={maintenance} />
              <NavItem to="/predictive" icon={<BrainCircuit />} label="AI Predictions" currentPath={location.pathname} sidebarOpen={sidebarOpen} alert={washrooms.some((w: any) => w.sensors?.soapLevel < 30 || w.sensors?.waterLevel < 30)} />
            </>
          )}

          {isAdmin && (
            <>
              {sidebarOpen && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-4">
                  Administration
                </p>
              )}
              <NavItem to="/leaderboard" icon={<Trophy />} label="Leaderboard" currentPath={location.pathname} sidebarOpen={sidebarOpen} />
              <NavItem to="/manage-users" icon={<Users />} label="Manage Users" currentPath={location.pathname} sidebarOpen={sidebarOpen} />
            </>
          )}
        </nav>

        {/* Sidebar footer */}
        {sidebarOpen && (
          <div className="px-4 pb-4 shrink-0">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-200/60 rounded-xl p-3.5">
              <p className="text-xs font-bold text-blue-800">🇮🇳 Smart City Initiative</p>
              <p className="text-[11px] text-blue-600/80 mt-1 leading-relaxed">
                Aligned with Swachh Bharat Abhiyan & 100 Smart Cities Mission
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ──── MAIN CONTENT AREA ──── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* ──── HEADER ──── */}
        <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Desktop toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Mobile toggle */}
            <button
              onClick={() => setMobileSidebar(true)}
              className="md:hidden text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {pageTitles[location.pathname] || 'CivicSync'}
              </h2>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="text-sm text-slate-400 font-medium">
                {isAdmin ? 'MCD Operations' : 'Nodal Operations'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role badge */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${isAdmin
                ? 'bg-emerald-50 border-emerald-200/60'
                : 'bg-blue-50 border-blue-200/60'
              }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isAdmin ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span className={`font-semibold text-xs ${isAdmin ? 'text-emerald-700' : 'text-blue-700'}`}>
                {isAdmin ? 'Super Admin' : 'Nodal Officer'}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={toggleNotif}
                className="relative p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Bell className="w-5 h-5" />
                {activeAlerts > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white" />
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-fade-in-up">
                  <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
                    <span className="font-bold text-slate-900 text-sm">Notifications</span>
                    <span className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-semibold">Mark all read</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {washrooms.filter(w => w.status === 'Red').map(wr => (
                      <div key={`red-${wr.washroomId}`} className="p-4 border-b border-slate-100 bg-red-50/60 hover:bg-red-50 cursor-pointer transition-colors">
                        <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Critical SOS Alert
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Emergency trigger at <span className="font-bold">{wr.locationName || wr.washroomId}</span>
                        </p>
                        <p className="text-[10px] text-red-400 mt-2 font-mono font-semibold">● LIVE</p>
                      </div>
                    ))}
                    {washrooms.filter(w => w.status === 'Yellow').map(wr => (
                      <div key={`yel-${wr.washroomId}`} className="p-4 border-b border-slate-100 hover:bg-amber-50/50 cursor-pointer transition-colors">
                        <p className="text-sm font-bold text-amber-600 flex items-center gap-2">
                          <Wind className="w-4 h-4" /> Maintenance Required
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Attention needed at <span className="font-bold">{wr.locationName || wr.washroomId}</span>
                        </p>
                        <p className="text-[10px] text-amber-400 mt-2 font-mono font-semibold">● LIVE</p>
                      </div>
                    ))}
                    {activeAlerts === 0 && maintenance === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        All systems optimal. No alerts.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={toggleProfile}
                className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center text-white cursor-pointer hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                <User className="w-4.5 h-4.5" />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden animate-fade-in-up">
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                    <p className="font-bold text-slate-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">
                      {isAdmin ? 'MCD Super Admin' : 'Nodal Officer'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{user?.email}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors flex items-center gap-2.5">
                      <Settings className="w-4 h-4" /> Account Settings
                    </button>
                    <button className="w-full text-left px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4" /> Access Controls
                    </button>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold flex items-center gap-2.5"
                    >
                      <LogOut className="w-4 h-4" /> Secure Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ──── PAGE ROUTER ──── */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          onClick={() => { setShowNotif(false); setShowProfile(false); }}
        >
          <Routes>
            <Route path="/" element={<Dashboard washrooms={washrooms} total={totalFacilities} maintenance={maintenance} alerts={activeAlerts} />} />
            {isAdmin && <Route path="/map" element={<LiveMap washrooms={washrooms} />} />}
            {isAdmin && <Route path="/safety" element={<Safety washrooms={washrooms} />} />}
            {!isAdmin && (
              <>
                <Route path="/dispatch" element={<Dispatch washrooms={washrooms} />} />
                <Route path="/predictive" element={<PredictiveMaintenance washrooms={washrooms} />} />
              </>
            )}
            {isAdmin && <Route path="/leaderboard" element={<Leaderboard />} />}
            {isAdmin && <Route path="/manage-users" element={<ManageUsers washrooms={washrooms} />} />}
          </Routes>
        </main>

        {/* ──── FOOTER ──── */}
        <footer className="shrink-0 bg-white border-t border-slate-200/80 px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  CivicSync <span className="font-normal text-slate-400">v1.0</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  AI-Driven Smart Sanitation & Safety System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="hidden sm:inline">🇮🇳 Swachh Bharat Abhiyan</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline">100 Smart Cities Mission</span>
              <span className="hidden sm:inline text-slate-300">•</span>

            </div>

            <div className="flex items-center gap-3">
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Globe className="w-4 h-4" /></a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Github className="w-4 h-4" /></a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Mail className="w-4 h-4" /></a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

/* ───────────────────── Nav Item ───────────────────── */
function NavItem({ to, icon, label, currentPath, sidebarOpen, badge, alert }: any) {
  const active = currentPath === to;
  return (
    <Link
      to={to}
      className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group ${active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600'
          }`}>
          <span className="w-[18px] h-[18px] flex items-center justify-center">{icon}</span>
        </div>
        {sidebarOpen && <span className="font-semibold text-[13px] tracking-tight">{label}</span>}
      </div>
      {sidebarOpen && badge > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200/60'
          }`}>
          {badge}
        </span>
      )}
      {sidebarOpen && alert && (
        <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-white' : 'bg-red-500'} animate-pulse`} />
      )}
    </Link>
  );
}

/* ───────────────────── App Wrapper ───────────────────── */
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/qr/:washroomId" element={<UnifiedQR />} />
          <Route path="/cleaner/:washroomId" element={<CleanerResolve />} />
          <Route path="/feedback/:washroomId" element={<FeedbackPortal />} />
          <Route path="/find" element={<WashroomFinder />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}