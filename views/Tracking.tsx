import React, { useState } from 'react';
import { useADPMappings, useDashboardStats } from '../hooks/useADPData';
import { useUsers } from '../hooks/useAdminData';
import { Card, Select, Input, Pagination, TableHeader, TableHead, TableRow, TableCell } from '../components/UI';
import { Activity, Clock, Calendar, CalendarDays, Filter, Loader2 } from 'lucide-react';

export const TrackingView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: users = [] } = useUsers();
  const { data: stats } = useDashboardStats(); // Global stats
  const { data: mappingsData, isLoading } = useADPMappings({
    page,
    size: 20,
    userId: selectedUser || undefined,
    dateFrom,
    dateTo
  });

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Activity Tracking</h1>
           <p className="text-slate-500">Monitor mapping updates and user contributions.</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium min-w-fit">
            <Filter size={18} />
            <span>Filters:</span>
          </div>
          <div className="w-full md:w-64">
             <Select 
                label="By User"
                value={selectedUser}
                onChange={e => { setSelectedUser(e.target.value); setPage(1); }}
                options={users.map(u => ({ value: u.id, label: u.name }))}
                className="bg-white"
             />
          </div>
          <div className="w-full md:w-48">
             <Input 
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="bg-white"
             />
          </div>
          <div className="w-full md:w-48">
             <Input 
                type="date"
                label="To Date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="bg-white"
             />
          </div>
          
          {(selectedUser || dateFrom || dateTo) && (
            <button 
              onClick={() => { setSelectedUser(''); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-red-500 hover:text-red-700 underline mt-auto mb-2 md:mb-0 md:mt-6"
            >
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <Card className="lg:col-span-2 flex flex-col h-[500px]">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Activity className="text-slash-red" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Recent Updates</h3>
            </div>
            <span className="text-xs text-slate-400">Showing {mappingsData?.content?.length || 0} items</span>
          </div>
          
          {isLoading ? <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin" /></div> : (
              <div className="flex-1 overflow-auto">
                 <table className="w-full">
                    <TableHeader>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Time</TableHead>
                    </TableHeader>
                    <tbody>
                        {(mappingsData?.content || []).map((m: any) => {
                             const user = users.find(u => u.id === m.updatedBy);
                             return (
                                 <TableRow key={m.id}>
                                     <TableCell>
                                         <div className="font-medium text-slate-700">{m.makeEnDesc} {m.modelEnDesc}</div>
                                         <div className="text-xs text-slate-400">{m.adpMakeId} / {m.adpModelId}</div>
                                     </TableCell>
                                     <TableCell>
                                         <span className={`text-xs px-2 py-1 rounded-full border ${m.status === 'MAPPED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {m.status}
                                         </span>
                                     </TableCell>
                                     <TableCell>
                                         <div className="text-sm">{user?.name || m.updatedBy || 'System'}</div>
                                     </TableCell>
                                     <TableCell>
                                         <div className="text-xs text-slate-500">{m.updatedAt ? new Date(m.updatedAt).toLocaleString() : '-'}</div>
                                     </TableCell>
                                 </TableRow>
                             );
                        })}
                    </tbody>
                 </table>
              </div>
          )}
          <div className="p-2 border-t border-slate-100">
             <Pagination currentPage={page} totalPages={mappingsData?.totalPages || 1} onPageChange={setPage} totalItems={mappingsData?.totalElements || 0} />
          </div>
        </Card>

        {/* Global Stats */}
        <div className="space-y-6">
             <Card className="p-6">
                <h3 className="text-md font-bold text-slate-800 mb-4">Activity Overview</h3>
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col text-center">
                        <Clock className="text-slate-400 mb-2 mx-auto" size={24} />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Mapped</span>
                        <span className="text-2xl font-bold text-slate-900 mt-1">{stats?.mappedCount || 0}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col text-center">
                        <Calendar className="text-slate-400 mb-2 mx-auto" size={24} />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Review</span>
                        {/* Assuming we can calculate pending from unmapped or missing, though stats API is better */}
                        <span className="text-2xl font-bold text-slate-900 mt-1">{stats?.unmappedCount || 0}</span>
                    </div>
                </div>
             </Card>
        </div>
      </div>
    </div>
  );
};