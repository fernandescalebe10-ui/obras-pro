import React, { useState } from 'react';
import Grapisos from '../images/Granpisos.jpeg';
import { Link, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Hammer, 
  Users, 
  Wallet, 
  Menu, 
  X,
  LogOut,
  Wrench
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/calendar', label: 'Calendário', icon: CalendarDays },
    { path: '/jobs', label: 'Obras', icon: Hammer },
    { path: '/financial', label: 'Financeiro', icon: Wallet },
    { path: '/installers', label: 'Instaladores', icon: Users },
    { path: '/services', label: 'Serviços', icon: Wrench },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const { logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    try { localStorage.removeItem('session_user'); } catch {}
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0 shadow-xl flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center h-28 px-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center w-full gap-3">
            {/* Logo Container - Rounded Square for full image visibility */}
            <div className="bg-white h-14 w-14 rounded-lg flex items-center justify-center shrink-0 shadow-lg overflow-hidden p-1">
              <img
                src={Grapisos}
                alt="Grapisos"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            <div className="flex flex-col justify-center">
              <span className="text-xl font-black text-blue-500 leading-none tracking-tight">Departamento</span>
              <span className="text-base font-bold text-red-600 leading-none tracking-wide mt-1">Obras</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-300 hover:text-white ml-auto">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 group
                  ${isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon size={20} className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={18} className="mr-3" />
            Sair do Sistema
          </button>
          <div className="mt-4 px-4 text-xs text-slate-500">
            v1.1.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white shadow-sm lg:px-8">
          <button onClick={toggleSidebar} className="text-gray-500 focus:outline-none lg:hidden">
            <Menu size={24} />
          </button>
          <div className="ml-4 lg:ml-0">
             <h1 className="text-lg font-semibold text-gray-800">
               {navItems.find(i => i.path === location.pathname)?.label || 'Bem-vindo'}
             </h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
               ADM
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;