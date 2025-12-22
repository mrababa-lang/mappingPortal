
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useADPMappings, useUpsertMapping } from '../hooks/useADPData';
import { useMakes, useModels } from '../hooks/useVehicleData';
import { useAppConfig } from '../hooks/useAdminData';
import { Card, Button, Select, Modal, TableHeader, TableHead, TableRow, TableCell, Input, SearchableSelect, Pagination, EmptyState, HighlightText, TableSkeleton } from '../components/UI';
import { Edit2, Loader2, Sparkles, Search, Filter, X, Calendar, Info, Tag, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { suggestMapping } from '../services/geminiService';
import { HistoryModal } from '../components/HistoryModal';

export const ADPMappingView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      updateParam('q', searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const statusFilter = searchParams.get('statusFilter') || 'MISSING_MODEL';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const q = debouncedSearch;

  const updateParam = (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if(value && value !== 'all') newParams.set(key, value); else newParams.delete(key);
      setSearchParams(newParams);
      setPage(1); 
  };

  const resetFilters = () => {
      setSearchQuery('');
      setDebouncedSearch('');
      setSearchParams(new URLSearchParams({ statusFilter: 'MISSING_MODEL' }));
      setPage(1);
  };

  const { data, isLoading } = useADPMappings({ 
      page, size: 20, 
      statusFilter, dateFrom, dateTo, q
  });
  
  const { data: makesData } = useMakes({ size: 1000 }); 
  const makes = makesData?.content || [];
  
  const { data: models = [] } = useModels();
  const { data: config } = useAppConfig();
  
  const upsertMapping = useUpsertMapping();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [mappingState, setMappingState] = useState({ makeId: '', modelId: '' });
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleOpenModal = (item: any) => {
      setSelectedItem(item);
      setMappingState({
          makeId: String(item.makeId || item.sdMakeId || ''),
          modelId: String(item.modelId || item.sdModelId || '')
      });
      setIsModalOpen(true);
  }

  const handleOpenHistory = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    setSelectedItem(item);
    setIsHistoryOpen(true);
  }

  const handleSave = () => {
      if (!mappingState.makeId || !mappingState.modelId) {
          toast.error("Both Make and Model are required to map this vehicle.");
          return;
      }

      const targetId = selectedItem?.adpId || selectedItem?.id;
      if(targetId) {
          upsertMapping.mutate({
              adpId: targetId,
              status: 'MAPPED', 
              makeId: mappingState.makeId,
              modelId: mappingState.modelId
          }, {
              onSuccess: () => {
                  setIsModalOpen(false);
                  toast.success("Mapping saved and moved to Review Queue");
              }
          });
      }
  }

  const handleAiSuggest = async () => {
    if (!selectedItem) return;
    setIsAiLoading(true);
    try {
        const description = `${selectedItem.makeEnDesc} ${selectedItem.modelEnDesc} ${selectedItem.typeEnDesc || ''}`;
        const result = await suggestMapping(description, config?.apiKey);
        if (result && result.make) {
            const foundMake = makes.find(m => 
              m.name.toLowerCase().includes(result.make.toLowerCase()) || 
              result.make.toLowerCase().includes(m.name.toLowerCase()) ||
              String(m.id).toLowerCase() === result.make.toLowerCase()
            );
            
            if (foundMake) {
                let foundModel = null;
                if (result.model) {
                   foundModel = models.find(m => {
                       const mMakeId = String(m.makeId || (m.make && m.make.id) || '');
                       return (mMakeId === String(foundMake.id)) && 
                       (m.name.toLowerCase().includes(result.model.toLowerCase()) || result.model.toLowerCase().includes(m.name.toLowerCase()));
                   });
                }
                setMappingState(prev => ({ 
                  ...prev, 
                  makeId: String(foundMake.id), 
                  modelId: foundModel ? String(foundModel.id) : prev.modelId 
                }));
                toast.success(`AI Suggestion: ${foundMake.name} ${foundModel ? foundModel.name : ''}`);
            } else {
                toast.error(`AI found "${result.make}" but it does not match any existing Make.`);
            }
        }
    } catch (e) {
        toast.error("AI suggestion failed.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || statusFilter !== 'MISSING_MODEL';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending ADP Mapping</h1>
            <p className="text-slate-500">Unmapped records and items with missing models requiring attention.</p>
         </div>
         <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-medium">
            <Info size={14} /> Rejected items from Review Queue will reappear here.
         </div>
      </div>

      <Card className="p-5 bg-white border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-5 items-end">
             <div className="w-full lg:flex-1 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Search Source</label>
                <div className="relative">
                    <Search className="absolute top-3 left-3 text-slate-400" size={18} />
                    <Input 
                        label="" 
                        placeholder="Search Make, Model or Type description..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-11"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><X size={16} /></button>}
                </div>
             </div>

             <div className="w-full lg:w-56">
                 <Select 
                    label="Filter Status" 
                    value={statusFilter} 
                    onChange={e => updateParam('statusFilter', e.target.value)} 
                    options={[
                        {value: 'MISSING_MODEL', label: 'Missing Model'}, 
                        {value: 'MISSING_MAKE', label: 'Missing Make'},
                        {value: 'UNMAPPED', label: 'Unmapped / Rejected'}
                    ]} 
                    className="h-11"
                 />
             </div>

             <div className="w-full lg:w-auto flex items-end gap-2">
                 <div className="w-36">
                    <Input label="From Date" type="date" value={dateFrom} onChange={e => updateParam('dateFrom', e.target.value)} className="h-11" />
                 </div>
                 <div className="w-36">
                    <Input label="To Date" type="date" value={dateTo} onChange={e => updateParam('dateTo', e.target.value)} className="h-11" />
                 </div>
             </div>

             {hasActiveFilters && (
                 <Button variant="ghost" onClick={resetFilters} className="text-red-500 h-11 mb-0.5 group">
                     <X size={16} className="group-hover:rotate-90 transition-transform"/> Clear
                 </Button>
             )}
        </div>
      </Card>

      <Card className="overflow-hidden border border-slate-200">
         {isLoading ? <TableSkeleton rows={10} cols={3} /> : (
         <>
             {(data?.content || []).length === 0 ? (
                <EmptyState 
                    title="Queue Clear"
                    description={`No items found matching the current filters.`}
                    icon={Search}
                    action={hasActiveFilters ? <Button variant="secondary" onClick={resetFilters}>Reset All Filters</Button> : null}
                />
             ) : (
             <div className="overflow-x-auto">
             <table className="w-full">
                <TableHeader>
                    <TableHead>Source Vehicle (ADP)</TableHead>
                    <TableHead>Current SD Mapping</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableHeader>
                <tbody>
                    {(data?.content || []).map((row: any) => (
                        <TableRow key={row.adpId || row.id} onClick={() => handleOpenModal(row)}>
                            <TableCell>
                                <div className="space-y-1">
                                    <div className="font-bold text-slate-900 text-sm leading-tight">
                                        <HighlightText text={`${row.makeEnDesc} ${row.modelEnDesc}`} highlight={debouncedSearch} />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded leading-none">
                                            {row.adpMakeId} / {row.adpModelId}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{row.typeEnDesc}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {row.sdMakeName ? (
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-indigo-700">{row.sdMakeName}</span>
                                        <span className="text-slate-300">/</span>
                                        {row.sdModelName ? (
                                              <span className="text-slate-700 font-medium">{row.sdModelName}</span>
                                        ) : (
                                            <span className="text-amber-500 text-xs font-bold italic bg-amber-50 px-2 py-0.5 rounded border border-amber-100">MISSING MODEL</span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-400 italic text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Unmapped
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-100" onClick={(e) => handleOpenHistory(e, row)}>
                                        <Clock size={16} className="text-slate-400" />
                                    </Button>
                                    <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-indigo-50 group" onClick={(e) => { e.stopPropagation(); handleOpenModal(row); }}>
                                        <Edit2 size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors"/>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
             </table>
             </div>
             )}
             <Pagination currentPage={page} totalPages={data?.totalPages || 1} onPageChange={setPage} totalItems={data?.totalElements || 0} />
         </>
         )}
      </Card>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} adpId={selectedItem?.adpId || selectedItem?.id} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Map Vehicle to SlashData" footer={<Button onClick={handleSave} className="w-full sm:w-auto px-10">Save Mapping</Button>}>
         <div className="space-y-5">
             <div className="flex justify-between items-start p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-1 bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-tighter rounded-bl">ADP SOURCE</div>
                 <div className="z-10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Raw Description</span>
                    <div className="font-bold text-lg text-slate-900 leading-tight">{selectedItem?.makeEnDesc} {selectedItem?.modelEnDesc}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-2"><Tag size={12} /> {selectedItem?.typeEnDesc}</div>
                 </div>
                 {config?.enableAI && (
                     <Button variant="ai" className="px-4 h-9 text-xs shadow-md" onClick={handleAiSuggest} isLoading={isAiLoading}><Sparkles size={14}/> Auto-Detect</Button>
                 )}
             </div>
             <div className="grid grid-cols-1 gap-5 pt-2">
                <SearchableSelect label="Target Make (Required)" value={mappingState.makeId} onChange={v => setMappingState({...mappingState, makeId: v, modelId: ''})} options={makes.map(m => ({value: String(m.id), label: m.name}))} placeholder="Search manufacturers..." />
                <SearchableSelect 
                  label="Target Model (Required)" 
                  value={mappingState.modelId} 
                  onChange={v => setMappingState({...mappingState, modelId: v})} 
                  disabled={!mappingState.makeId} 
                  options={models.filter(m => {
                    const mMakeId = String(m.makeId || (m.make && m.make.id) || '');
                    return mMakeId === String(mappingState.makeId);
                  }).map(m => ({value: String(m.id), label: m.name}))} 
                  placeholder={mappingState.makeId ? "Search models..." : "Select a Make first"} 
                />
             </div>
             <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700 leading-relaxed">
                <strong>Note:</strong> Saving this mapping will set its status to <strong>MAPPED</strong> and send it to the <strong>Review Queue</strong> for final verification.
             </div>
         </div>
      </Modal>
    </div>
  );
};
