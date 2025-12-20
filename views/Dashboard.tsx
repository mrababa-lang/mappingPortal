
import React, { useState, useEffect } from 'react';
import { useDashboardStats, useTrendStats, useActivityLog } from '../hooks/useADPData';
import { Card, Skeleton, CardSkeleton } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { Car, Tags, Settings2, TrendingUp, CheckCircle2, AlertTriangle, FileWarning, Activity, Link, Filter, Clock, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
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
  const { data: trendData, isLoading: trendLoading } = useTrendStats(dateFrom, dateTo);
  const { data: recentActivity, isLoading: activityLoading } = useActivityLog();

  const safeStats = stats || {
    totalMakes: 0, totalModels: 0, totalTypes: 0,
    adpTotalMakes: 0, adpTotalModels: 0, adpTotalTypes: 0,
    mappedCount: 0, unmappedCount: 0, missingModelCount: 0, missingMakeCount: 0,
    localizationScore: 0
  };

  const chartData = [
    { name: 'Mapped', count: safeStats.mappedCount, color: '#10B981', filter: 'mapped' },
    { name: 'Unmapped', count: safeStats.unmappedCount, color: '#94A3B8', filter: 'unmapped' },
    { name: 'No Model', count: safeStats.missingModelCount, color: '#F59E0B', filter: 'issues' },
  ];

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
       const payload = data.activePayload[0].payload;
       navigate(`/adp-mapping?statusFilter=${payload.filter}`);
    }
  };

  const kpiCards = [
    { label: 'Makes', sdCount: safeStats.totalMakes, adpCount: safeStats.adpTotalMakes || 0, icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Models', sdCount: safeStats.totalModels, adpCount: safeStats.adpTotalModels || 0, icon: Settings2, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Vehicle Types', sdCount: safeStats.totalTypes, adpCount: safeStats.adpTotalTypes || 0, icon: Tags, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  ];

  const totalADPRecords = (safeStats.mappedCount || 0) + (safeStats.unmappedCount || 0);
  const mappingCoverage = totalADPRecords > 0 ? Math.round((safeStats.mappedCount / totalADPRecords) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Overview</h2>
            <p className="text-slate-500 text-sm">Key metrics and mapping progress based on live ADP integration.</p>
         </div>
         <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <Filter size={16} className="text-slate-400 ml-2" />
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">From</span>
               <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-xs border-none bg-slate-50 rounded px-2 py-1 text-slate-700 focus:ring-0 cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">To</span>
               <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-xs border-none bg-slate-50 rounded px-2 py-1 text-slate-700 focus:ring-0 cursor-pointer" />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsLoading ? [...Array(3)].map((_, i) => <CardSkeleton key={i} />) : kpiCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6 flex items-start justify-between hover:shadow-md transition-shadow group">
              <div className="w-full">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                        <Icon size={20} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
                    <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">SlashData</span>
                        <h3 className="text-2xl font-bold text-slate-900 leading-none">{stat.sdCount}</h3>
                    </div>
                    <div className="pl-4">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">ADP</span>
                        <h3 className="text-2xl font-bold text-slate-600 leading-none">{stat.adpCount}</h3>
                    </div>
                </div>
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
               {statsLoading ? <Skeleton className="w-full h-full rounded-lg" /> : (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} onClick={handleBarClick} className="cursor-pointer">
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                     <Tooltip cursor={{fill: '#F1F5F9'}} />
                     <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                       {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               )}
             </div>
           </Card>

           <Card className="p-6 flex flex-col h-[320px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Mapping Activity Trend</h3>
              <div className="flex-1 w-full min-h-0">
                {trendLoading ? <Skeleton className="w-full h-full rounded-lg" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.isArray(trendData) ? trendData : []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-5 border border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                   <Link size={16} className="text-indigo-600" /> Coverage
                 </h3>
                 {statsLoading ? <Skeleton className="h-6 w-10" /> : <span className={`text-lg font-bold ${mappingCoverage < 80 ? 'text-amber-500' : 'text-emerald-600'}`}>{mappingCoverage}%</span>}
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full transition-all duration-500 ${mappingCoverage < 100 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${mappingCoverage}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">SlashData / Total ADP Ratio</p>
           </Card>

           <Card className="flex-1 overflow-hidden flex flex-col h-[500px]">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                  <Activity size={16} className="text-indigo-500" /> Recent Activity
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto">
               {activityLoading ? (
                 <div className="p-4 space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="divide-y divide-slate-50">
                   {(recentActivity || []).map((item: any, i: number) => (
                       <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === 'MAPPED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {item.status === 'MAPPED' ? 'Mapping confirmed' : 'Mapping updated'}
                             </span>
                             <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={10}/> {new Date(item.updatedAt).toLocaleString()}
                             </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-snug">
                             Vehicle record <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1 rounded">{item.adpMasterId?.substring(0, 8)}</span> was updated.
                          </p>
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
