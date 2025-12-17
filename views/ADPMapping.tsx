import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useADPMappings, useUpsertMapping } from '../hooks/useADPData';
import { useMakes, useModels } from '../hooks/useVehicleData';
import { useAppConfig } from '../hooks/useAdminData';
import { Card, Button, Select, Modal, TableHeader, TableHead, TableRow, TableCell, Input, SearchableSelect, Pagination, EmptyState } from '../components/UI';
import { Edit2, Loader2, Sparkles, Search, Filter, X, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { suggestMapping } from '../services/geminiService';

export const ADPMappingView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  
  // Default status filter to MISSING_MODEL, allow changing to UNMAPPED, exclude MAPPED
  const statusFilter = searchParams.get('statusFilter') || 'MISSING_MODEL';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const q = searchParams.get('q') || '';

  const updateParam = (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if(value && value !== 'all') newParams.set(key, value); else newParams.delete(key);
      setSearchParams(newParams);
      setPage(1); 
  };

  const resetFilters = () => {
      setSearchParams(new URLSearchParams({ statusFilter: 'MISSING_MODEL' }));
      setPage(1);
  };

  const { data, isLoading } = useADPMappings({ 
      page, size: 20, 
      statusFilter, dateFrom, dateTo, q
  });
  
  const { data: makes = [] } = useMakes();
  const { data: models = [] } = useModels();
  const { data: config } = useAppConfig();
  
  const upsertMapping = useUpsertMapping();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [mappingState, setMappingState] = useState({ makeId: '', modelId: '' });
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleOpenModal = (item: any) => {
      setSelectedItem(item);
      setMappingState({
          makeId: item.makeId || item.sdMakeId || '',
          modelId: item.modelId || item.sdModelId || ''
      });
      setIsModalOpen(true);
  }

  const handleSave = () => {
      // Enforce both Make and Model selection
      if (!mappingState.makeId || !mappingState.modelId) {
          toast.error("Both Make and Model are required to map this vehicle.");
          return;
      }

      const targetId = selectedItem?.adpId || selectedItem?.id;
      
      if(targetId) {
          upsertMapping.mutate({
              adpId: targetId,
              status: 'MAPPED', // Always set to MAPPED
              makeId: mappingState.makeId,
              modelId: mappingState.modelId
          }, {
              onSuccess: () => {
                  setIsModalOpen(false);
                  toast.success("Mapping saved");
              }
          });
      } else {
        toast.error("Error: Item ID missing");
      }
  }

  const handleAiSuggest = async () => {
    if (!selectedItem) return;
    setIsAiLoading(true);
    
    try {
        const description = `${selectedItem.makeEnDesc} ${selectedItem.modelEnDesc} ${selectedItem.typeEnDesc || ''}`;
        const result = await suggestMapping(description);
        
        if (result && result.make) {
            const foundMake = makes.find(m => m.name.toLowerCase().includes(result.make.toLowerCase()) || result.make.toLowerCase().includes(m.name.toLowerCase()));
            
            if (foundMake) {
                let foundModel = null;
                if (result.model) {
                   foundModel = models.find(m => 
                       ((m.makeId || (m.make && m.make.id)) == foundMake.id) && 
                       (m.name.toLowerCase().includes(result.model.toLowerCase()) || result.model.toLowerCase().includes(m.name.toLowerCase()))
                   );
                }

                setMappingState(prev => ({
                    ...prev,
                    makeId: foundMake.id,
                    modelId: foundModel ? foundModel.id : prev.modelId
                }));
                
                toast.success(`AI Suggestion: ${foundMake.name} ${foundModel ? foundModel.name : ''}`);
            } else {
                toast.error(`AI found "${result.make}" but it does not match any existing Make.`);
            }
        } else {
            toast.info("AI could not identify a vehicle clearly.");
        }
    } catch (e) {
        toast.error("AI suggestion failed.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const hasActiveFilters = q || dateFrom || dateTo || statusFilter !== 'MISSING_MODEL';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending ADP Mapping</h1>
            <p className="text-slate-500">Review unmapped vehicles and missing models.</p>
         </div>
      </div>

      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="w-full md:flex-1 relative">
                <Search className="absolute top-9 left-3 text-slate-400" size={18} />
                <Input 
                  label="Search" 
                  placeholder="Search ADP Vehicle..." 
                  value={q}
                  onChange={e => updateParam('q', e.target.value)}
                  className="pl-10"
                />
             </div>
             <div className="w-full md:w-56">
                 <Select 
                    label="Status" 
                    value={statusFilter} 
                    onChange={e => updateParam('statusFilter', e.target.value)} 
                    options={[
                        {value: 'MISSING_MODEL', label: 'Missing Model'}, 
                        {value: 'MISSING_MAKE', label: 'Missing Make'},
                        {value: 'UNMAPPED', label: 'Unmapped'}
                    ]} 
                 />
             </div>
             <div className="w-full md:w-auto flex items-end gap-2">
                 <div className="w-36">
                    <Input 
                        label="From" 
                        type="date" 
                        value={dateFrom} 
                        onChange={e => updateParam('dateFrom', e.target.value)} 
                    />
                 </div>
                 <div className="w-36">
                    <Input 
                        label="To" 
                        type="date" 
                        value={dateTo} 
                        onChange={e => updateParam('dateTo', e.target.value)} 
                    />
                 </div>
             </div>
             {hasActiveFilters && (
                 <Button variant="ghost" onClick={resetFilters} className="text-red-500 h-[42px] mb-0.5">
                     <X size={16} /> Clear
                 </Button>
             )}
        </div>
      </Card>

      <Card className="overflow-hidden">
         {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div> : (
         <>
             {(data?.content || []).length === 0 ? (
                <EmptyState 
                    title="No Pending Items"
                    description="Great job! There are no records matching your current filters."
                    icon={Search}
                />
             ) : (
             <div className="overflow-x-auto">
             <table className="w-full">
                <TableHeader>
                    <TableHead>ADP Vehicle</TableHead>
                    <TableHead>SD Mapping</TableHead>
                    <TableHead>Action</TableHead>
                </TableHeader>
                <tbody>
                    {(data?.content || []).map((row: any) => (
                        <TableRow key={row.adpId || row.id} onClick={() => handleOpenModal(row)}>
                            <TableCell>
                                <div className="font-medium text-slate-900">{row.makeEnDesc} {row.modelEnDesc}</div>
                                <span className="font-mono text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{row.adpMakeId} / {row.adpModelId}</span>
                            </TableCell>
                            <TableCell>
                                {row.sdMakeName ? (
                                    <div className="flex items-center gap-1">
                                        <span className="font-medium text-indigo-700">{row.sdMakeName}</span>
                                        {row.sdModelName ? (
                                            <>
                                              <span className="text-slate-400">/</span>
                                              <span className="text-slate-700">{row.sdModelName}</span>
                                            </>
                                        ) : (
                                            <span className="text-amber-500 text-xs italic ml-1">(Missing Model)</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-slate-400 italic">Not Mapped</span>
                                )}
                            </TableCell>
                            <TableCell><Button variant="ghost" onClick={() => handleOpenModal(row)}><Edit2 size={16}/></Button></TableCell>
                        </TableRow>
                    ))}
                </tbody>
             </table>
             </div>
             )}
             <Pagination 
                currentPage={page} 
                totalPages={data?.totalPages || 1} 
                onPageChange={setPage} 
                totalItems={data?.totalElements || 0} 
             />
         </>
         )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Map Vehicle" footer={<Button onClick={handleSave}>Save</Button>}>
         <div className="space-y-4">
             <div className="flex justify-between items-start p-3 bg-slate-50 rounded">
                 <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">Source Description:</span>
                    <div className="font-medium">{selectedItem?.makeEnDesc} {selectedItem?.modelEnDesc}</div>
                    <div className="text-xs text-slate-500 mt-1">Type: {selectedItem?.typeEnDesc}</div>
                 </div>
                 {config?.enableAI && (
                     <Button variant="ai" className="px-3 h-8 text-xs" onClick={handleAiSuggest} isLoading={isAiLoading}>
                         <Sparkles size={14}/> Auto-Detect
                     </Button>
                 )}
             </div>

             <SearchableSelect 
                label="Make (Required)" 
                value={mappingState.makeId} 
                onChange={v => setMappingState({...mappingState, makeId: v, modelId: ''})} 
                options={(Array.isArray(makes) ? makes : []).map(m => ({value: m.id, label: m.name}))} 
             />
             
             <SearchableSelect 
                label="Model (Required)" 
                value={mappingState.modelId} 
                onChange={v => setMappingState({...mappingState, modelId: v})} 
                options={(Array.isArray(models) ? models : [])
                    .filter(m => {
                        const modelMakeId = m.makeId || (m.make && m.make.id);
                        return modelMakeId == mappingState.makeId;
                    })
                    .map(m => ({value: m.id, label: m.name}))} 
             />
         </div>
      </Modal>
    </div>
  );
};