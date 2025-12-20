
import React, { useState, useEffect, useRef } from 'react';
import { useSlashMasterData, downloadSlashMasterReport, useMakes, useTypes } from '../hooks/useVehicleData';
import { useDashboardStats } from '../hooks/useADPData';
import { Card, Button, Input, Pagination, TableHeader, TableHead, TableRow, TableCell, SearchableSelect, Select, HighlightText, TableSkeleton } from '../components/UI';
import { Download, Loader2, Search, Database, Tag, Car, Settings2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { useVirtualizer } from '@tanstack/react-virtual';

export const SlashMasterDataView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Search Debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: stats } = useDashboardStats();
  const { data: makes = [] } = useMakes();
  const { data: types = [] } = useTypes();

  const { data, isLoading } = useSlashMasterData({ 
      page, 
      size: 50, // Larger size for virtualization feel
      q: debouncedSearch,
      makeId: selectedMake,
      typeId: selectedType
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = data?.content || [];

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10
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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <StatCard label="Total Makes" value={stats?.totalMakes} icon={Car} color="#3b82f6" />
          <StatCard label="Total Models" value={stats?.totalModels} icon={Settings2} color="#8b5cf6" />
          <StatCard label="Total Types" value={stats?.totalTypes} icon={Tag} color="#10b981" />
      </div>

      <Card className="p-4 bg-white border border-slate-200 shrink-0">
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
                   onChange={e => { setSearchQuery(e.target.value); }}
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

      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {isLoading ? <TableSkeleton rows={8} cols={3} /> : (
        <>
            <div ref={parentRef} className="flex-1 overflow-auto">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                <table className="w-full">
                  <TableHeader>
                      <TableHead className="w-1/3">Make</TableHead>
                      <TableHead className="w-1/3">Model</TableHead>
                      <TableHead className="w-1/3">Assigned Type</TableHead>
                  </TableHeader>
                  <tbody>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const row = rows[virtualRow.index];
                      return (
                        <tr
                          key={virtualRow.key}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`
                          }}
                          className="border-b border-slate-100 hover:bg-slate-50 flex items-center px-4"
                        >
                          <td className="w-1/3 px-6 py-2 text-sm text-slate-600">
                             <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                      <Car size={14} />
                                  </div>
                                  <div className="truncate">
                                      <div className="font-medium text-slate-900"><HighlightText text={row.makeName} highlight={debouncedSearch} /></div>
                                      <div className="text-[10px] text-slate-400 font-mono leading-none">{row.makeId}</div>
                                  </div>
                              </div>
                          </td>
                          <td className="w-1/3 px-6 py-2 text-sm text-slate-600">
                              <div className="truncate">
                                  <div className="font-medium text-slate-900"><HighlightText text={row.modelName} highlight={debouncedSearch} /></div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-slate-400 font-mono leading-none">{row.modelId}</span>
                                      {row.modelNameAr && <span className="text-[10px] text-slate-500 font-sans" dir="rtl">{row.modelNameAr}</span>}
                                  </div>
                              </div>
                          </td>
                          <td className="w-1/3 px-6 py-2 text-sm text-slate-600">
                              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 max-w-full">
                                  <Tag size={12} className="text-slate-500 shrink-0" />
                                  <span className="text-xs font-medium text-slate-700 truncate">{row.typeName || '-'}</span>
                              </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination currentPage={page} totalPages={data?.totalPages || 1} onPageChange={setPage} totalItems={data?.totalElements || 0} />
        </>
        )}
      </Card>
    </div>
  );
};
