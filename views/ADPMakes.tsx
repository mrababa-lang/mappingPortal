
import React, { useState } from 'react';
import { useADPUniqueMakes, useSaveMakeMapping, useDashboardStats, downloadADPMakesReport } from '../hooks/useADPData';
import { useMakes } from '../hooks/useVehicleData';
import { Card, Button, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, SearchableSelect, Input, Select, EmptyState } from '../components/UI';
import { Edit2, Link, CheckCircle2, AlertTriangle, RefreshCw, Search, Loader2, Car, Factory, PieChart, Download, X, Hash } from 'lucide-react';
import { toast } from 'sonner';

export const ADPMakesView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  
  const { data, isLoading, refetch } = useADPUniqueMakes({ page, size: 20, q: searchQuery, status: statusFilter });
  const { data: stats } = useDashboardStats();
  // Fix: useMakes returns a paginated object. Access content property.
  const { data: sdMakesData } = useMakes({ size: 1000 });
  const sdMakes = sdMakesData?.content || [];
  const saveMappingMutation = useSaveMakeMapping();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdpMake, setSelectedAdpMake] = useState<any | null>(null);
  const [selectedSdMakeId, setSelectedSdMakeId] = useState<string>('');

  const handleOpenModal = (item: any) => {
    setSelectedAdpMake(item);
    // Use loose check for existing mapping from various possible field names
    const existingId = item.sdMakeId || item.makeId || '';
    setSelectedSdMakeId(String(existingId));
    setIsModalOpen(true);
  };

  const handleSaveMapping = () => {
    if (!selectedAdpMake || !selectedSdMakeId) return;

    saveMappingMutation.mutate({
        adpMakeId: selectedAdpMake.adpMakeId, 
        sdMakeId: selectedSdMakeId
    }, {
        onSuccess: () => {
            setIsModalOpen(false);
            toast.success("Manufacturer mapping synchronized successfully");
            refetch();
        }
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
        await downloadADPMakesReport(statusFilter);
        toast.success("Manufacturer report generated.");
    } catch (e) {
        toast.error("Export operation failed.");
    } finally {
        setIsExporting(false);
    }
  };

  const resetFilters = () => {
      setSearchQuery('');
      setStatusFilter('all');
      setPage(1);
  };

  // KPI Calculations
  const sdTotal = stats?.totalMakes || 0;
  const adpTotal = stats?.adpTotalMakes || 0;
  const adpMapped = stats?.adpMappedMakes || 0;
  const coveragePercent = adpTotal > 0 ? Math.round((adpMapped / adpTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Make Mapping</h1>
           <p className="text-slate-500 text-sm font-medium">Link source ERP manufacturer codes with SlashData master identifiers.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Button variant="secondary" onClick={() => refetch()} className="flex-1 md:flex-none h-11">
              <RefreshCw size={16} /> Refresh
            </Button>
            <Button variant="primary" onClick={handleExport} isLoading={isExporting} className="flex-1 md:flex-none h-11">
              <Download size={16} /> Export CSV
            </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 flex items-start justify-between border-l-4 border-blue-500">
              <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">SlashData Master</p>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{sdTotal}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Verified Manufacturers</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shadow-sm"><Car size={24} /></div>
          </Card>
          <Card className="p-5 flex items-start justify-between border-l-4 border-purple-500">
              <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">ADP Unique Source</p>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{adpTotal}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">ERP Source Records</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shadow-sm"><Factory size={24} /></div>
          </Card>
          <Card className="p-5 flex items-start justify-between border-l-4 border-emerald-500">
              <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Coverage Score</p>
                  <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{coveragePercent}%</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{adpMapped} of {adpTotal} mapped</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shadow-sm"><PieChart size={24} /></div>
          </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="w-full md:flex-1 relative">
                <Search className="absolute top-9 left-3 text-slate-400" size={18} />
                <Input 
                  label="Dynamic Filter" 
                  placeholder="Manufacturer name or code..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10 h-11"
                />
             </div>
             <div className="w-full md:w-64">
                 <Select 
                    label="Alignment Status"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    options={[
                        {value: 'all', label: 'All Records'},
                        {value: 'mapped', label: 'Mapped'},
                        {value: 'unmapped', label: 'Unmapped'}
                    ]}
                    className="h-11"
                 />
             </div>
             {(searchQuery || statusFilter !== 'all') && (
                 <Button variant="ghost" onClick={resetFilters} className="text-rose-600 h-11 mb-0.5 px-4 font-bold hover:bg-rose-50 rounded-lg">
                     <X size={16} /> Clear
                 </Button>
             )}
        </div>
      </Card>

      <Card className="overflow-hidden border border-slate-200 shadow-sm">
        {isLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div> : (
        <>
            {(data?.content || []).length === 0 ? (
                <EmptyState 
                    title="No Alignment Records Found" 
                    description="Adjust your search criteria or synchronize data from the source system." 
                    icon={Search}
                />
            ) : (
                <div className="overflow-x-auto">
                <table className="w-full">
                    <TableHeader className="bg-slate-50/50">
                        <TableHead className="w-[15%]">ADP Code</TableHead>
                        <TableHead className="w-[30%]">ADP Description (EN/AR)</TableHead>
                        <TableHead className="w-[35%]">SlashData Target Mapping</TableHead>
                        <TableHead className="w-[10%]">Status</TableHead>
                        <TableHead className="w-[10%] text-right px-8">Actions</TableHead>
                    </TableHeader>
                    <tbody className="divide-y divide-slate-100">
                    {(data?.content || []).map((item: any) => {
                        // Fix: sdMakes is an array from sdMakesData.content
                        const targetId = item.sdMakeId || item.makeId;
                        const mappedSdMake = sdMakes.find(m => String(m.id) === String(targetId));
                        
                        return (
                        <TableRow key={item.adpMakeId || item.id} onClick={() => handleOpenModal(item)} className="group">
                            <TableCell>
                                <span className="font-mono text-[11px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded shadow-sm">
                                    {item.adpMakeId}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="font-bold text-slate-900 text-sm leading-tight">
                                        {item.makeEnDesc || item.adpMakeName || item.enDescription || 'Unnamed'}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-sans font-medium" dir="rtl">
                                        {item.makeArDesc || item.arDescription || 'غير مسمى'}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                            {mappedSdMake ? (
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Car size={14} />
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-900 text-sm leading-tight truncate uppercase tracking-tight">{mappedSdMake.name}</span>
                                            <span className="text-[9px] font-mono font-black bg-slate-900 text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                                                ID: {mappedSdMake.id}
                                            </span>
                                        </div>
                                        {mappedSdMake.nameAr && (
                                            <div className="text-[11px] text-indigo-500 font-sans font-bold truncate" dir="rtl">
                                                {mappedSdMake.nameAr}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-300 italic text-sm font-medium">
                                    <AlertTriangle size={14} /> 
                                    <span>Unlinked Record</span>
                                </div>
                            )}
                            </TableCell>
                            <TableCell>
                                {mappedSdMake ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        Mapped
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                                        Pending
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="text-right px-8">
                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-indigo-50 group-hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}>
                                    <Link size={16} className="text-slate-400 group-hover:text-indigo-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            )}
            <div className="bg-slate-50/30">
                <Pagination currentPage={page} totalPages={data?.totalPages || 1} onPageChange={setPage} totalItems={data?.totalElements || 0} />
            </div>
        </>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Establish Make Alignment"
        footer={
          <div className="flex justify-between items-center w-full">
            <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-tighter">Automatic Audit Capture Enabled</p>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveMapping} disabled={!selectedSdMakeId} className="px-8 shadow-lg shadow-indigo-500/10">Save Mapping</Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {selectedAdpMake && (
             <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-slate-200/50 text-[9px] font-black text-slate-500 uppercase tracking-widest rounded-bl-xl">SOURCE DATA</div>
                <div className="grid grid-cols-2 gap-8">
                   <div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">ADP Code</span>
                     <span className="font-mono font-black text-slate-900 text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">{selectedAdpMake.adpMakeId}</span>
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Source Descriptions</span>
                     <div className="font-black text-slate-900 leading-tight text-base mb-1">{selectedAdpMake.makeEnDesc || selectedAdpMake.adpMakeName || selectedAdpMake.enDescription}</div>
                     <div className="text-sm text-slate-500 font-sans font-medium" dir="rtl">{selectedAdpMake.makeArDesc || selectedAdpMake.arDescription || 'غير مسمى'}</div>
                   </div>
                </div>
             </div>
          )}
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 mb-1">
                <Hash size={14} className="text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Target SlashData Master</h3>
            </div>
            <SearchableSelect 
               label=""
               value={selectedSdMakeId}
               onChange={value => setSelectedSdMakeId(value)}
               options={sdMakes.map(m => ({ 
                   value: String(m.id), 
                   label: `${m.name} (${m.nameAr || '---'}) [ID: ${m.id}]` 
               }))}
               placeholder="Search manufacturers by name or ID..."
            />
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3 items-start">
                <AlertTriangle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-700 font-medium leading-relaxed uppercase tracking-tight">
                    Linking this source record to the master identifier will automatically propagate the mapping to all associated model child-records in the pending queue.
                </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
