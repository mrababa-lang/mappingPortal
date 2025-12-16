import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useADPMappings, useUpsertMapping } from '../hooks/useADPData';
import { useMakes, useModels } from '../hooks/useVehicleData';
import { useAppConfig } from '../hooks/useAdminData';
import { ADPMapping, ADPMaster } from '../types';
import { Card, Button, Select, Modal, TableHeader, TableHead, TableRow, TableCell, Input, SearchableSelect, Pagination } from '../components/UI';
import { Edit2, Filter, Download, CheckCircle2, AlertTriangle, HelpCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { suggestMapping } from '../services/geminiService';

export const ADPMappingView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  
  // Sync state with URL params
  const statusFilter = searchParams.get('statusFilter') || 'all';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const q = searchParams.get('q') || '';

  const updateParam = (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if(value && value !== 'all') newParams.set(key, value); else newParams.delete(key);
      setSearchParams(newParams);
      setPage(1); // Reset page on filter change
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
  const [mappingState, setMappingState] = useState({ status: 'MAPPED', makeId: '', modelId: '' });
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleOpenModal = (item: any) => {
      setSelectedItem(item);
      setMappingState({
          status: item.status || 'MAPPED',
          makeId: item.makeId || item.sdMakeId || '', // Check if this corresponds to sdMakeId in data
          modelId: item.modelId || item.sdModelId || ''
      });
      setIsModalOpen(true);
  }

  const handleSave = () => {
      // Use adpId if available (Virtual View often returns adpId instead of id)
      const targetId = selectedItem?.adpId || selectedItem?.id;
      
      if(targetId) {
          upsertMapping.mutate({
              adpId: targetId,
              ...mappingState
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
            // Fuzzy match Make
            const foundMake = makes.find(m => m.name.toLowerCase().includes(result.make.toLowerCase()) || result.make.toLowerCase().includes(m.name.toLowerCase()));
            
            if (foundMake) {
                let foundModel = null;
                // If we found a make, try to find the model belonging to it
                if (result.model) {
                   foundModel = models.find(m => 
                       // Handle both flat makeId and nested make.id
                       ((m.makeId || (m.make && m.make.id)) == foundMake.id) && 
                       (m.name.toLowerCase().includes(result.model.toLowerCase()) || result.model.toLowerCase().includes(m.name.toLowerCase()))
                   );
                }

                setMappingState(prev => ({
                    ...prev,
                    makeId: foundMake.id,
                    modelId: foundModel ? foundModel.id : prev.modelId,
                    status: foundModel ? 'MAPPED' : 'MISSING_MODEL' // Default to MISSING_MODEL if AI found make but not model
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

  const renderStatus = (status: string) => {
      switch(status) {
          case 'MAPPED': return <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Mapped</span>;
          case 'MISSING_MAKE': return <span className="text-red-600 flex items-center gap-1"><AlertTriangle size={12}/> Missing Make</span>;
          case 'MISSING_MODEL': return <span className="text-amber-600 flex items-center gap-1"><HelpCircle size={12}/> Missing Model</span>;
          default: return <span className="text-slate-400 flex items-center gap-1"><AlertCircle size={12}/> Unmapped</span>;
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <h1 className="text-2xl font-bold">ADP Mapping</h1>
         <div className="flex gap-2">
             <Select 
                label="" 
                value={statusFilter} 
                onChange={e => updateParam('statusFilter', e.target.value)} 
                options={[{value: 'all', label: 'All'}, {value: 'mapped', label: 'Mapped'}, {value: 'unmapped', label: 'Unmapped'}]} 
             />
             <Input 
                label="" 
                type="date" 
                value={dateFrom} 
                onChange={e => updateParam('dateFrom', e.target.value)} 
             />
         </div>
      </div>

      <Card className="overflow-hidden">
         {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div> : (
         <>
             <div className="overflow-x-auto">
             <table className="w-full">
                <TableHeader>
                    <TableHead>ADP Vehicle</TableHead>
                    <TableHead>SD Mapping</TableHead>
                    <TableHead>Status</TableHead>
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
                                {row.sdMakeName ? `${row.sdMakeName} ${row.sdModelName || ''}` : '-'}
                            </TableCell>
                            <TableCell>{renderStatus(row.status)}</TableCell>
                            <TableCell><Button variant="ghost" onClick={() => handleOpenModal(row)}><Edit2 size={16}/></Button></TableCell>
                        </TableRow>
                    ))}
                </tbody>
             </table>
             </div>
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
             
             <div className="flex gap-2">
                 <Button variant={mappingState.status === 'MAPPED' ? 'primary' : 'secondary'} onClick={() => setMappingState({...mappingState, status: 'MAPPED'})} className="flex-1 text-xs">Mapped</Button>
                 <Button variant={mappingState.status === 'MISSING_MODEL' ? 'primary' : 'secondary'} onClick={() => setMappingState({...mappingState, status: 'MISSING_MODEL'})} className="flex-1 text-xs">Missing Model</Button>
             </div>

             <SearchableSelect 
                label="Make" 
                value={mappingState.makeId} 
                onChange={v => setMappingState({...mappingState, makeId: v, modelId: ''})} 
                options={(Array.isArray(makes) ? makes : []).map(m => ({value: m.id, label: m.name}))} 
             />
             
             {mappingState.status === 'MAPPED' && (
                 <SearchableSelect 
                    label="Model" 
                    value={mappingState.modelId} 
                    onChange={v => setMappingState({...mappingState, modelId: v})} 
                    options={(Array.isArray(models) ? models : [])
                        .filter(m => {
                            // Backend may return nested 'make' object OR flat 'makeId'
                            // Also handle string/number mismatch with loose equality
                            const modelMakeId = m.makeId || (m.make && m.make.id);
                            return modelMakeId == mappingState.makeId;
                        })
                        .map(m => ({value: m.id, label: m.name}))} 
                 />
             )}
         </div>
      </Modal>
    </div>
  );
};