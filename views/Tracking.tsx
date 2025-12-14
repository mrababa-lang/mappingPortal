import React, { useMemo, useState } from 'react';
import { DataService } from '../services/storageService';
import { Card, Select, Input } from '../components/UI';
import { Activity, Clock, Calendar, CalendarDays, Filter } from 'lucide-react';

export const TrackingView: React.FC = () => {
  const mappings = DataService.getADPMappings();
  const users = DataService.getUsers();

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // --- Filtering Logic ---
  const filteredMappings = useMemo(() => {
    return mappings.filter(m => {
      // User Filter
      if (selectedUser && m.updatedBy !== selectedUser) return false;
      
      // Date Range Filter
      if (m.updatedAt) {
        const mappingDate = new Date(m.updatedAt);
        
        if (dateFrom) {
          const startDate = new Date(dateFrom);
          // Set to beginning of the day in local time
          startDate.setHours(0, 0, 0, 0);
          if (mappingDate < startDate) return false;
        }

        if (dateTo) {
          const endDate = new Date(dateTo);
          // Set to end of the day in local time
          endDate.setHours(23, 59, 59, 999);
          if (mappingDate > endDate) return false;
        }
      } else if (dateFrom || dateTo) {
        // If filtering by date but mapping has no timestamp, exclude it
        return false;
      }
      
      return true;
    });
  }, [mappings, selectedUser, dateFrom, dateTo]);

  // --- Stats Calculation based on filtered results ---
  const activityStats = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const getCountSince = (date: Date) => {
      // Use filteredMappings to reflect current filter context, 
      // but "Last Hour/Day" stats usually imply "Recent Global Activity".
      // However, if we want the stats cards to reflect the filtered dataset (e.g., "How many did John do in the last hour within the selected date range?"),
      // we use filteredMappings. If the filter excludes "Last Hour" (e.g. date range is last year), this will be 0.
      return filteredMappings.filter(m => m.updatedAt && new Date(m.updatedAt) > date).length;
    };

    return {
      hour: getCountSince(oneHourAgo),
      day: getCountSince(oneDayAgo),
      week: getCountSince(oneWeekAgo)
    };
  }, [filteredMappings]);

  // --- User Activity Calculation ---
  const userActivity = useMemo(() => {
    // Calculate counts based on the filtered mappings
    const counts: Record<string, number> = {};
    filteredMappings.forEach(m => {
      if (m.updatedBy) {
        counts[m.updatedBy] = (counts[m.updatedBy] || 0) + 1;
      }
    });

    let displayUsers = users;
    
    // Apply user filter (show only selected user in the list if selected)
    if (selectedUser) {
      displayUsers = displayUsers.filter(u => u.id === selectedUser);
    }

    return displayUsers
      .map(u => ({
        ...u,
        count: counts[u.id] || 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredMappings, users, selectedUser]);

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
                onChange={e => setSelectedUser(e.target.value)}
                options={users.map(u => ({ value: u.id, label: u.name }))}
                className="bg-white"
             />
          </div>
          <div className="w-full md:w-48">
             <Input 
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-white"
             />
          </div>
          <div className="w-full md:w-48">
             <Input 
                type="date"
                label="To Date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-white"
             />
          </div>
          
          {(selectedUser || dateFrom || dateTo) && (
            <button 
              onClick={() => { setSelectedUser(''); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-red-500 hover:text-red-700 underline mt-auto mb-2 md:mb-0 md:mt-6"
            >
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time-based metrics (Contextual to filters) */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-slash-red" size={20} />
            <h3 className="text-lg font-bold text-slate-800">Filtered Activity Stats</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <Clock className="text-slate-400 mb-2" size={24} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Hour</span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{activityStats.hour}</span>
              <span className="text-xs text-slate-400">matching updates</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <Calendar className="text-slate-400 mb-2" size={24} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last 24 Hours</span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{activityStats.day}</span>
              <span className="text-xs text-slate-400">matching updates</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
              <CalendarDays className="text-slate-400 mb-2" size={24} />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last 7 Days</span>
              <span className="text-2xl font-bold text-slate-900 mt-1">{activityStats.week}</span>
              <span className="text-xs text-slate-400">matching updates</span>
            </div>
          </div>
        </Card>

        {/* User Leaderboard */}
        <Card className="p-0 overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 pb-4 border-b border-slate-100 bg-white">
            <h3 className="text-lg font-bold text-slate-800">User Contributions</h3>
            <p className="text-xs text-slate-500 mt-1">Updates based on current filters</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {userActivity.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold 
                    ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">{user.count}</span>
                  <span className="text-xs text-slate-400">updates</span>
                </div>
              </div>
            ))}
            {userActivity.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No users found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};