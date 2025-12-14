import React, { useState } from 'react';
import { useADPMappings, useUpsertMapping } from '../hooks/useADPData';
import { useMakes, useModels } from '../hooks/useVehicleData';
import { ADPMapping, ADPMaster } from '../types';
import { Card, Button, Select, Modal, TableHeader, TableHead, TableRow, TableCell, Input, SearchableSelect } from '../components/UI';
import { Edit2, Filter, Download, CheckCircle2, AlertTriangle, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ADPMappingView: React.FC<{ initialParams?: any }> = ({ initialParams }) => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
      statusFilter: initialParams?.statusFilter || 'all',
      dateFrom: initialParams?.dateFrom || '',
      dateTo: initialParams?.dateTo || '',
      q: ''
  });
  
  const { data, isLoading } = useADPMappings({ 
      page, size: 20, 
      ...filters 
  });
  
  const { data: makes = [] } = useMakes();
  const { data: models = [] } = useModels();
  
  const upsertMapping = useUpsertMapping();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ADPMaster | null>(null);
  const [mappingState, setMappingState] = useState({ status: 'MAPPED', makeId: '', modelId: '' });

  const handleOpenModal = (item: any) => {
      // item here is the composite object from backend which might include mapping info
      // Assuming backend returns a flat DTO or we extract it. 
      // For this implementation, we assume `item` contains adp master fields + mapping fields
      setSelectedItem(item);
      setMappingState({
          status: item.status || 'MAPPED',
          makeId: item.makeId || '',
          modelId: item.modelId || ''
      });
      setIsModalOpen(true);
  }

  const handleSave = () => {
      if(selectedItem) {
          upsertMapping.mutate({
              adpId: selectedItem.id,
              ...mappingState
          }, {
              onSuccess: () => {
                  setIsModalOpen(false);
                  toast.success("Mapping saved");
              }
          });
      }
  }

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
             <Select label="" value={filters.statusFilter} onChange={e => setFilters({...filters, statusFilter: e.target.value})} 
                options={[{value: 'all', label: 'All'}, {value: 'mapped', label: 'Mapped'}, {value: 'unmapped', label: 'Unmapped'}]} />
             <Input label="" type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
         </div>
      </div>

      <Card>
         {isLoading ? <Loader2 className="animate-spin m-auto" /> : (
         <>
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
                                <div>{row.makeEnDesc} {row.modelEnDesc}</div>
                                <div className="text-xs text-slate-500">{row.adpMakeId} / {row.adpModelId}</div>
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
             <div className="p-4 flex justify-between">
                 <Button variant="secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
                 <span>Page {page}</span>
                 <Button variant="secondary" onClick={()=>setPage(p=>p+1)}>Next</Button>
             </div>
         </>
         )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Map Vehicle" footer={<Button onClick={handleSave}>Save</Button>}>
         <div className="space-y-4">
             <div className="p-3 bg-slate-50 rounded">
                 <span className="text-xs font-bold text-slate-500">Target:</span>
                 <div>{selectedItem?.makeEnDesc} {selectedItem?.modelEnDesc}</div>
             </div>
             
             <div className="flex gap-2">
                 <Button variant={mappingState.status === 'MAPPED' ? 'primary' : 'secondary'} onClick={() => setMappingState({...mappingState, status: 'MAPPED'})} className="flex-1 text-xs">Mapped</Button>
                 <Button variant={mappingState.status === 'MISSING_MODEL' ? 'primary' : 'secondary'} onClick={() => setMappingState({...mappingState, status: 'MISSING_MODEL'})} className="flex-1 text-xs">Missing Model</Button>
             </div>

             <SearchableSelect 
                label="Make" 
                value={mappingState.makeId} 
                onChange={v => setMappingState({...mappingState, makeId: v})} 
                options={makes.map(m => ({value: m.id, label: m.name}))} 
             />
             
             {mappingState.status === 'MAPPED' && (
                 <SearchableSelect 
                    label="Model" 
                    value={mappingState.modelId} 
                    onChange={v => setMappingState({...mappingState, modelId: v})} 
                    options={models.filter(m => m.makeId === mappingState.makeId).map(m => ({value: m.id, label: m.name}))} 
                 />
             )}
         </div>
      </Modal>
    </div>
  );
};
