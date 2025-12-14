import React, { useState, useEffect } from 'react';
import { useDashboardStats, useTrendStats, useActivityLog } from '../hooks/useADPData';
import { Card } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Car, Tags, Settings2, TrendingUp, CheckCircle2, AlertTriangle, FileWarning, Activity, Languages, Loader2, Filter } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Sync state with URL
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const setDateFrom = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if(val) newParams.set('dateFrom', val); else newParams.delete('dateFrom');
    setSearchParams(newParams);
  }

  const setDateTo = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if(val) newParams.set('dateTo', val); else newParams.delete('dateTo');
    setSearchParams(newParams);
  }

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: trendData } = useTrendStats(dateFrom, dateTo);
  const { data: recentActivity } = useActivityLog();

  if (statsLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;
  }

  // Fallback defaults if API returns null/undefined
  const safeStats = stats || {
    totalMakes: 0, totalModels: 0, totalTypes: 0,
    mappedCount: 0, unmappedCount: 0, missingModelCount: 0, missingMakeCount: 0,
    localizationScore: 0
  };

  const chartData = [
    { name: 'Mapped', count: safeStats.mappedCount, color: '#10B981', filter: 'mapped' },
    { name: 'Unmapped', count: safeStats.unmappedCount, color: '#94A3B8', filter: 'unmapped' },
    { name: 'No Model', count: safeStats.missingModelCount, color: '#F59E0B', filter: 'issues' },
    { name: 'No Make', count: safeStats.missingMakeCount, color: '#EF4444', filter: 'issues' },
  ];

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
       const payload = data.activePayload[0].payload;
       // Navigate to Mapping view with pre-filled filters
       navigate(`/adp-mapping?statusFilter=${payload.filter}`);
    }
  };

  const kpiCards = [
    { label: 'Total Makes', value: safeStats.totalMakes, icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Models', value: safeStats.totalModels, icon: Settings2, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Vehicle Types', value: safeStats.totalTypes, icon: Tags, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg Models/Make', value: safeStats.totalMakes ? (safeStats.totalModels / safeStats.totalMakes).toFixed(1) : '0', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-xl font-bold text-slate-800">System Overview</h2>
            <p className="text-slate-500 text-sm">Key metrics and mapping progress (Live Data).</p>
         </div>
         <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <Filter size={16} className="text-slate-400 ml-2" />
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 font-medium">From</span>
               <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs border-none bg-slate-50 rounded px-2 py-1 text-slate-700 focus:ring-0" />
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 font-medium">To</span>
               <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs border-none bg-slate-50 rounded px-2 py-1 text-slate-700 focus:ring-0" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((stat, idx) => {
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
        <div className="lg:col-span-2 space-y-6">
           <Card className="p-6 flex flex-col h-[380px]">
             <h3 className="text-lg font-bold text-slate-800 mb-2">Mapping Distribution</h3>
             <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} onClick={handleBarClick} className="cursor-pointer">
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                   <Tooltip cursor={{fill: '#F1F5F9'}} />
                   <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50}>
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </Card>

           <Card className="p-6 flex flex-col h-[320px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Mapping Activity Trend</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Array.isArray(trendData) ? trendData : []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-5 border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                   <Languages size={18} className="text-emerald-600" />
                   Data Quality
                 </h3>
                 <span className={`text-xl font-bold ${safeStats.localizationScore < 80 ? 'text-amber-500' : 'text-emerald-600'}`}>
                   {safeStats.localizationScore}%
                 </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                <div className={`h-1.5 rounded-full ${safeStats.localizationScore < 100 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${safeStats.localizationScore}%` }}></div>
              </div>
              <p className="text-xs text-slate-500">Localization completeness across all master data.</p>
           </Card>

           <Card className="flex-1 overflow-hidden flex flex-col h-[500px]">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-500" />
                  Recent Activity
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-0">
               {!recentActivity || !Array.isArray(recentActivity) || recentActivity.length === 0 ? (
                 <div className="p-6 text-center text-slate-400 text-sm">No recent activity.</div>
               ) : (
                 <div className="divide-y divide-slate-50">
                   {recentActivity.map((item: any, i: number) => (
                     <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                           <span className="text-xs font-bold text-slate-700">{item.user}</span>
                           <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug mb-1">{item.details}</p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
};