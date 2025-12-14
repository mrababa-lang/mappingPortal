import React from 'react';
import { DataService } from '../services/storageService';
import { Card } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Car, Tags, Settings2, TrendingUp, CheckCircle2, AlertTriangle, HelpCircle, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const makes = DataService.getMakes();
  const models = DataService.getModels();
  const types = DataService.getTypes();
  const adpMaster = DataService.getADPMaster();
  const adpMappings = DataService.getADPMappings();

  // ADP Statistics Calculation
  const totalADP = adpMaster.length;
  const mappedCount = adpMappings.filter(m => !m.status || m.status === 'MAPPED').length;
  const missingMakeCount = adpMappings.filter(m => m.status === 'MISSING_MAKE').length;
  const missingModelCount = adpMappings.filter(m => m.status === 'MISSING_MODEL').length;
  const unmappedCount = Math.max(0, totalADP - adpMappings.length);

  const chartData = [
    { name: 'Mapped', count: mappedCount, color: '#10B981' },       // Emerald
    { name: 'Unmapped', count: unmappedCount, color: '#94A3B8' },   // Slate
    { name: 'No Model', count: missingModelCount, color: '#F59E0B' }, // Amber
    { name: 'No Make', count: missingMakeCount, color: '#EF4444' },   // Red
  ];

  const stats = [
    { label: 'Total Makes', value: makes.length, icon: Car, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Models', value: models.length, icon: Settings2, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Vehicle Types', value: types.length, icon: Tags, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg Models/Make', value: (models.length / (makes.length || 1)).toFixed(1), icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADP Statistics Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col h-[450px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">ADP Mapping Statistics</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#F1F5F9'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Insights - ADP Focus */}
        <Card className="p-6 h-[450px] overflow-y-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Insights</h3>
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                  <CheckCircle2 size={16} />
                </div>
                <span className="font-medium text-slate-700">Fully Mapped</span>
              </div>
              <span className="font-bold text-emerald-700">{mappedCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-full text-slate-600">
                  <AlertCircle size={16} />
                </div>
                <span className="font-medium text-slate-700">Unmapped</span>
              </div>
              <span className="font-bold text-slate-700">{unmappedCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                  <HelpCircle size={16} />
                </div>
                <span className="font-medium text-slate-700">Missing Model</span>
              </div>
              <span className="font-bold text-amber-700">{missingModelCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-full text-red-600">
                  <AlertTriangle size={16} />
                </div>
                <span className="font-medium text-slate-700">Missing Make</span>
              </div>
              <span className="font-bold text-red-700">{missingMakeCount}</span>
            </div>

          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
                <p className="font-medium mb-1">Total ADP Coverage</p>
                <div className="w-full bg-white/20 rounded-full h-2 mb-2 mt-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500" 
                    style={{ width: `${totalADP > 0 ? (mappedCount / totalADP * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs opacity-80">
                  {totalADP > 0 ? ((mappedCount / totalADP) * 100).toFixed(1) : 0}% of master data mapped
                </p>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};