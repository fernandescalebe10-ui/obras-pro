import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Hammer, 
  Users, 
  Wallet, 
  Menu, 
  X,
  LogOut
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
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
        <div className="flex items-center justify-between h-16 px-6 bg-slate-800 border-b border-slate-700">
          <span className="text-xl font-bold tracking-wider text-white">Gestor<span className="text-primary">PRO</span></span>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-300 hover:text-white">
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
          <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={18} className="mr-3" />
            Sair do Sistema
          </button>
          <div className="mt-4 px-4 text-xs text-slate-500">
            v1.0.0
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