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
  Factory,
  Settings,
  Shapes,
  ChevronRight,
  Truck
} from 'lucide-react';
import { Toaster } from 'sonner';
import { NavItem, User } from '../types';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  onLogout?: () => void;
  user: User | null;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

// Map IDs to Routes
const ALL_NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: "Vehicle Master",
    items: [
      { id: 'makes', label: 'Makes', icon: Car },
      { id: 'models', label: 'Models', icon: Settings2 },
      { id: 'types', label: 'Types', icon: Tags },
    ]
  },
  {
    title: "ADP Integration",
    items: [
      { id: 'adp-master', label: 'ADP Master', icon: Database },
      { id: 'adp-makes', label: 'ADP Makes', icon: Factory },
      { id: 'adp-types', label: 'ADP Types', icon: Shapes },
      { id: 'adp-mapping', label: 'Vehicle Mapping', icon: Link },
      { id: 'adp-mapped-vehicles', label: 'Mapped List', icon: Truck },
      { id: 'mapping-review', label: 'Review Queue', icon: ClipboardCheck },
    ]
  },
  {
    title: "System",
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'tracking', label: 'Audit Log', icon: PieChart },
      { id: 'configuration', label: 'Settings', icon: Settings },
    ]
  }
];

export const Layout: React.FC<LayoutProps> = ({ onLogout, user }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Filter Navigation based on Roles
  const navGroups = useMemo(() => {
    if (!user) return [];
    
    // Normalize role: handle "ROLE_ADMIN" prefix often sent by Spring Security
    let normalizedRole = (user.role || '').toString().toUpperCase();
    if (normalizedRole.startsWith('ROLE_')) {
      normalizedRole = normalizedRole.replace('ROLE_', '');
    }
    
    return ALL_NAV_GROUPS.map(group => {
      const filteredItems = group.items.filter(item => {
        // Admin: Access Everything
        if (normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN') return true;

        // Mapping Admin
        if (normalizedRole === 'MAPPING_ADMIN') {
          const allowedIds = [
            'dashboard', 'makes', 'models', 'types',
            'adp-master', 'adp-makes', 'adp-types', 'adp-mapping', 'adp-mapped-vehicles', 'mapping-review'
          ];
          return allowedIds.includes(item.id);
        }

        // Mapping User
        if (normalizedRole === 'MAPPING_USER') {
           const allowedIds = [
             'dashboard',
             'adp-master', 'adp-makes', 'adp-types', 'adp-mapping', 'adp-mapped-vehicles'
           ];
           return allowedIds.includes(item.id);
        }
        
        // Default: No access if role unrecognized, or strictly specific roles
        return false;
      });
      return { ...group, items: filteredItems };
    }).filter(group => group.items.length > 0);
  }, [user]);

  const currentPath = location.pathname.substring(1) || 'dashboard';

  const getCurrentLabel = () => {
    for (const group of ALL_NAV_GROUPS) {
      const found = group.items.find(i => currentPath.startsWith(i.id));
      if (found) return found.label;
    }
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-72' : 'w-20'} 
          bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col shadow-2xl z-30 relative`}
      >
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-9 h-9 rounded-lg bg-slash-red flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-rose-900/50">
              S/
            </div>
            <div className={`flex flex-col transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <span className="font-bold text-white text-lg tracking-tight leading-none">SlashData</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Vehicle Portal</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-4 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {group.title && (
                <div className={`px-2 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath.startsWith(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/${item.id}`)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                        ${isActive 
                          ? 'bg-slash-red text-white shadow-lg shadow-rose-900/20' 
                          : 'hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <Icon size={20} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                      <span className={`font-medium text-sm whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        {item.label}
                      </span>
                      {isActive && sidebarOpen && (
                        <ChevronRight size={14} className="ml-auto opacity-50" />
                      )}
                      {!sidebarOpen && (
                         <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                           {item.label}
                         </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Toggle & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 mt-auto">
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 transition-colors mb-4 border border-slate-800"
           >
             <Menu size={16} />
           </button>
           
           {onLogout && (
             <div className={`flex items-center gap-3 px-2 transition-all duration-200 ${!sidebarOpen ? 'justify-center' : ''}`}>
               <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                 <UserCircle size={20} />
               </div>
               <div className={`overflow-hidden transition-all duration-200 ${sidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>
                 <div className="text-xs font-medium text-white truncate max-w-[120px]">{user?.fullName || 'User'}</div>
                 <button onClick={onLogout} className="text-[10px] text-slash-red hover:underline flex items-center gap-1 mt-0.5">
                   <LogOut size={10} /> Sign out
                 </button>
               </div>
             </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight flex items-center gap-2">
              {getCurrentLabel()}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-xs font-medium text-slate-600">System Operational</span>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-auto p-8 relative scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};