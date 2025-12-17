import React, { useState } from 'react';
import { useSlashMasterData, downloadSlashMasterReport, useMakes, useTypes } from '../hooks/useVehicleData';
import { useDashboardStats } from '../hooks/useADPData';
import { Card, Button, Input, Pagination, TableHeader, TableHead, TableRow, TableCell, SearchableSelect, Select } from '../components/UI';
import { Download, Loader2, Search, Database, Tag, Car, Settings2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

export const SlashMasterDataView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Data Hooks
  const { data: stats } = useDashboardStats();
  const { data: makes = [] } = useMakes();
  const { data: types = [] } = useTypes();

  const { data, isLoading } = useSlashMasterData({ 
      page, 
      size: 20, 
      q: searchQuery,
      makeId: selectedMake,
      typeId: selectedType
  });

  const handleExport = async () => {
      setIsExporting(true);
      try {
          await downloadSlashMasterReport(selectedMake, selectedType);
          toast.success("Master data exported successfully");
      } catch (e) {
          toast.error("Failed to export master data");
      } finally {
          setIsExporting(false);
      }
  };

  const clearFilters = () => {
      setSearchQuery('');
      setSelectedMake('');
      setSelectedType('');
      setPage(1);
  };

  const hasFilters = searchQuery || selectedMake || selectedType;

  // Stats Card Component
  const StatCard = ({ label, value, icon: Icon, color }: any) => (
      <Card className="p-4 flex items-center justify-between border-l-4" style={{ borderLeftColor: color }}>
          <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{value?.toLocaleString() || 0}</h3>
          </div>
          <div className={`p-2 rounded-lg opacity-80`} style={{ backgroundColor: `${color}20`, color: color }}>
              <Icon size={20} />
          </div>
      </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">SlashData Master Data</h1>
           <p className="text-slate-500">Consolidated view of internal Makes, Models, and Types.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} isLoading={isExporting}>
                <Download size={18} /> Export CSV
            </Button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Makes" value={stats?.totalMakes} icon={Car} color="#3b82f6" />
          <StatCard label="Total Models" value={stats?.totalModels} icon={Settings2} color="#8b5cf6" />
          <StatCard label="Total Types" value={stats?.totalTypes} icon={Tag} color="#10b981" />
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
             <div className="w-full lg:flex-1">
                 <SearchableSelect 
                    label="Filter by Make"
                    placeholder="Select Manufacturer..."
                    value={selectedMake}
                    onChange={(val) => { setSelectedMake(val); setPage(1); }}
                    options={makes.map(m => ({ value: m.id, label: m.name }))}
                    className="w-full"
                 />
             </div>
             <div className="w-full lg:w-48">
                 <Select 
                    label="Filter by Type"
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                    options={types.map(t => ({ value: t.id, label: t.name }))}
                 />
             </div>
             <div className="w-full lg:flex-1 relative">
                 <Search className="absolute top-9 left-3 text-slate-400" size={18} />
                 <Input 
                   label="Search" 
                   placeholder="Model name..." 
                   value={searchQuery}
                   onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                   className="pl-10"
                 />
             </div>
             {hasFilters && (
                 <Button variant="ghost" onClick={clearFilters} className="text-red-500 h-[42px] mb-0.5">
                     <X size={16} /> Clear
                 </Button>
             )}
        </div>
      </Card>

      {/* Data Table */}
      <Card className="overflow-hidden">
        {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div> : (
        <>
            <div className="overflow-x-auto">
            <table className="w-full">
                <TableHeader>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Assigned Type</TableHead>
                </TableHeader>
                <tbody>
                    {(data?.content || []).length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-8 text-slate-500">No vehicles found matching your criteria.</td></tr>
                    ) : (data?.content || []).map((row: any) => (
                        <TableRow key={`${row.makeId}-${row.modelId}`}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Car size={18} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{row.makeName}</div>
                                        <div className="text-xs text-slate-400 font-mono">{row.makeId}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div>
                                    <div className="font-medium text-slate-900">{row.modelName}</div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-400 font-mono">{row.modelId}</span>
                                        {row.modelNameAr && <span className="text-xs text-slate-500 font-sans" dir="rtl">{row.modelNameAr}</span>}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                                    <Tag size={12} className="text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">{row.typeName || '-'}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </table>
            </div>
            <Pagination currentPage={page} totalPages={data?.totalPages || 1} onPageChange={setPage} totalItems={data?.totalElements || 0} />
        </>
        )}
      </Card>
    </div>
  );
};