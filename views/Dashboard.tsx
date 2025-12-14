import React, { useState, useMemo } from 'react';
import { DataService } from '../services/storageService';
import { Card, Input } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Car, Tags, Settings2, TrendingUp, CheckCircle2, AlertTriangle, HelpCircle, AlertCircle, Calendar, Filter, Activity } from 'lucide-react';
import { ViewState } from '../types';

interface DashboardProps {
  onNavigate?: (view: ViewState, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const makes = DataService.getMakes();
  const models = DataService.getModels();
  const types = DataService.getTypes();
  const adpMaster = DataService.getADPMaster();
  const allMappings = DataService.getADPMappings();
  const recentActivity = DataService.getRecentActivity(8);

  // Filter mappings based on date range
  const filteredMappings = useMemo(() => {
    if (!dateFrom && !dateTo) return allMappings;
    return allMappings.filter(m => {
      if (!m.updatedAt) return false;
      const d = new Date(m.updatedAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59);
        if (d > end) return false;
      }
      return true;
    });
  }, [allMappings, dateFrom, dateTo]);

  // ADP Statistics Calculation (KPIs)
  // For total/unmapped, logic depends if we only want to show stats for *activity* in range or status state.
  // Standard dashboard usually shows current state. Date filter applies mostly to activity/trends.
  // However, let's make the charts reflect the filter.
  // Unmapped count is absolute unless we interpret "Unmapped in range" which doesn't make sense.
  // We will keep absolute stats for top cards (Entity Counts) and filtered stats for Mapping Progress.
  
  const mappedCount = filteredMappings.filter(m => !m.status || m.status === 'MAPPED').length;
  const missingMakeCount = filteredMappings.filter(m => m.status === 'MISSING_MAKE').length;
  const missingModelCount = filteredMappings.filter(m => m.status === 'MISSING_MODEL').length;
  // Note: Unmapped count is tricky with date filter. We'll show absolute unmapped count if no filter, otherwise N/A or just ignore date for unmapped.
  // Let's stick to absolute counts for the Bar Chart to represent *Current System State*, 
  // but if a user filters by date, they probably want to see *what happened* in that period.
  // A mixed approach: Top KPIs are static (System Totals). Charts/Activity are filtered.
  
  const absoluteMappedCount = allMappings.filter(m => !m.status || m.status === 'MAPPED').length;
  const unmappedCount = Math.max(0, adpMaster.length - allMappings.length);

  const chartData = [
    { name: 'Mapped', count: mappedCount, color: '#10B981', filter: 'mapped' },       // Emerald
    { name: 'Unmapped', count: unmappedCount, color: '#94A3B8', filter: 'unmapped' },   // Slate (Absolute)
    { name: 'No Model', count: missingModelCount, color: '#F59E0B', filter: 'issues' }, // Amber
    { name: 'No Make', count: missingMakeCount, color: '#EF4444', filter: 'issues' },   // Red
  ];

  // Trend Chart Data (Last 30 Days or Range)
  const trendData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    const map = new Map<string, number>();

    filteredMappings.forEach(m => {
      if (m.updatedAt) {
        const day = new Date(m.updatedAt).toISOString().split('T')[0];
        map.set(day, (map.get(day) || 0) + 1);
      }
    });

    // Fill last 30 days if no range, or range days
    const end = dateTo ? new Date(dateTo) : new Date();
    const start = dateFrom ? new Date(dateFrom) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
       const dayStr = d.toISOString().split('T')[0];
       data.push({ date: dayStr, count: map.get(dayStr) || 0 });
    }
    return data;
  }, [filteredMappings, dateFrom, dateTo]);

  const stats = [
    { label: 'Total Makes', value: makes.length, icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Models', value: models.length, icon: Settings2, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Vehicle Types', value: types.length, icon: Tags, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg Models/Make', value: (models.length / (makes.length || 1)).toFixed(1), icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const handleBarClick = (data: any) => {
    if (onNavigate && data && data.activePayload && data.activePayload.length > 0) {
       const payload = data.activePayload[0].payload;
       onNavigate('adp-mapping', { 
         statusFilter: payload.filter,
         dateFrom: dateFrom, // carry over date context
         dateTo: dateTo
       });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-xl font-bold text-slate-800">System Overview</h2>
            <p className="text-slate-500 text-sm">Key metrics and mapping progress.</p>
         </div>
         {/* Date Filter */}
         <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <Filter size={16} className="text-slate-400 ml-2" />
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 font-medium">From</span>
               <input 
                 type="date" 
                 value={dateFrom} 
                 onChange={e => setDateFrom(e.target.value)}
                 className="text-xs border-none bg-slate-50 rounded px-2 py-1 text-slate-700 focus:ring-0"
               />
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 font-medium">To</span>
               <input 
                 type="date" 
                 value={dateTo} 
                 onChange={e => setDateTo(e.target.value)}
                 className="text-xs border-none bg-slate-50 rounded px-2 py-1 text-slate-700 focus:ring-0"
               />
            </div>
         </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6 flex items-start justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
           {/* ADP Statistics Chart */}
           <Card className="p-6 flex flex-col h-[380px]">
             <h3 className="text-lg font-bold text-slate-800 mb-2">Mapping Distribution</h3>
             <p className="text-xs text-slate-500 mb-6">Distribution of ADP records by mapping status. Click bars to drill down.</p>
             <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                    data={chartData} 
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    onClick={handleBarClick}
                    className="cursor-pointer"
                 >
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                   <Tooltip 
                     cursor={{fill: '#F1F5F9'}} 
                     contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                   />
                   <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50}>
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </Card>

           {/* Trend Chart */}
           <Card className="p-6 flex flex-col h-[320px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Mapping Activity Trend</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                       dataKey="date" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#64748B', fontSize: 10}} 
                       tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                       dy={10}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                    <Tooltip 
                       contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                       labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </Card>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
           {/* Coverage Widget */}
           <Card className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
               <h3 className="text-lg font-bold mb-2">ADP Coverage</h3>
               <div className="flex items-end gap-2 mb-2">
                 <span className="text-4xl font-bold">{adpMaster.length > 0 ? ((absoluteMappedCount / adpMaster.length) * 100).toFixed(1) : 0}%</span>
                 <span className="text-white/80 text-sm mb-1">of master data</span>
               </div>
               <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-1000" 
                    style={{ width: `${adpMaster.length > 0 ? (absoluteMappedCount / adpMaster.length * 100) : 0}%` }}
                  ></div>
               </div>
               <p className="text-xs text-white/70">
                 {absoluteMappedCount} mapped out of {adpMaster.length} total records.
               </p>
           </Card>

           {/* Activity Feed */}
           <Card className="flex-1 overflow-hidden flex flex-col h-[650px]">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" />
                  Recent Activity
                </h3>
                <span className="text-xs text-slate-400">Latest Updates</span>
             </div>
             <div className="flex-1 overflow-y-auto p-0">
               {recentActivity.length === 0 ? (
                 <div className="p-6 text-center text-slate-400 text-sm">No recent activity.</div>
               ) : (
                 <div className="divide-y divide-slate-50">
                   {recentActivity.map((item) => (
                     <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                           <span className="text-xs font-bold text-slate-700">{item.user}</span>
                           <span className="text-[10px] text-slate-400">{new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug mb-1">
                          {item.action}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                           <span className="text-xs text-slate-500 truncate max-w-[200px]" title={item.adp}>{item.adp}</span>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
             <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
               <button 
                  onClick={() => onNavigate && onNavigate('tracking')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
               >
                 View All Activity
               </button>
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
};