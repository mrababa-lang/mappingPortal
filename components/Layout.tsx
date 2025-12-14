import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Settings2, 
  Tags,
  Menu,
  UserCircle,
  Database,
  Link,
  Users,
  PieChart,
  ClipboardCheck,
  LogOut,
  Factory
} from 'lucide-react';
import { Toaster } from 'sonner';
import { NavItem, ViewState, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout?: () => void;
  user: User | null;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    title: "Vehicle Management",
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'makes', label: 'Vehicle Makes', icon: Car },
      { id: 'models', label: 'Vehicle Models', icon: Settings2 },
      { id: 'types', label: 'Vehicle Types', icon: Tags },
    ]
  },
  {
    title: "ADP",
    items: [
      { id: 'adp-master', label: 'ADP Master', icon: Database },
      { id: 'adp-makes', label: 'ADP Makes', icon: Factory },
      { id: 'adp-mapping', label: 'ADP Mapping', icon: Link },
      { id: 'mapping-review', label: 'Mapping Review', icon: ClipboardCheck },
    ]
  },
  {
    title: "Administration",
    items: [
      { id: 'users', label: 'User Management', icon: Users },
      { id: 'tracking', label: 'Activity Tracking', icon: PieChart },
    ]
  }
];

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, onLogout, user }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Filter Navigation based on Roles
  const navGroups = useMemo(() => {
    if (!user) return [];

    return ALL_NAV_GROUPS.map(group => {
      // Filter items inside the group
      const filteredItems = group.items.filter(item => {
        
        // 1. Admin: Access Everything
        if (user.role === 'Admin') return true;

        // 2. Mapping Admin: Access ADP + Vehicle Management
        if (user.role === 'Mapping Admin') {
          // Allow Vehicle Management Group + ADP Group
          const allowedIds = [
            'dashboard', 'makes', 'models', 'types', // Vehicle Mgmt
            'adp-master', 'adp-makes', 'adp-mapping', 'mapping-review' // ADP
          ];
          return allowedIds.includes(item.id);
        }

        // 3. Mapping User: Access ADP Only (No Review)
        if (user.role === 'Mapping User') {
           const allowedIds = [
             'dashboard', // Usually good to give them dashboard read-only
             'adp-master', 'adp-makes', 'adp-mapping'
           ];
           // Explicitly EXCLUDE mapping-review
           return allowedIds.includes(item.id);
        }

        return false;
      });

      return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0); // Only return groups that have items
  }, [user]);

  // Helper to find label for header
  const getCurrentLabel = () => {
    for (const group of ALL_NAV_GROUPS) {
      const found = group.items.find(i => i.id === currentView);
      if (found) return found.label;
    }
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Toaster position="top-right" richColors closeButton />
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} 
          bg-slate-900 text-white transition-all duration-300 flex flex-col shadow-2xl z-20`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-slash-red to-rose-600 flex items-center justify-center font-bold text-white shrink-0">
              F/
            </div>
            <span className={`font-bold text-lg tracking-tight transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              First Tech
            </span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {group.title && (
                <div className={`px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-slash-red to-rose-600 text-white shadow-lg shadow-rose-900/20' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 mt-auto">
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors mb-2"
           >
             <Menu size={20} />
           </button>
           {onLogout && (
             <button 
               onClick={onLogout}
               className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group"
             >
               <div className="w-8 flex justify-center"><LogOut size={20} /></div>
               <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                 Sign Out
               </span>
             </button>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">
            {getCurrentLabel()}
          </h2>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.role || 'Guest'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <UserCircle size={28} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};