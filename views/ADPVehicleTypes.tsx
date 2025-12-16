import React, { useState } from 'react';
import { useADPUniqueTypes, useSaveTypeMapping } from '../hooks/useADPData';
import { useTypes } from '../hooks/useVehicleData';
import { Card, Button, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, SearchableSelect, Input } from '../components/UI';
import { Link, CheckCircle2, AlertTriangle, RefreshCw, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ADPVehicleTypesView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, refetch } = useADPUniqueTypes({ page, size: 20, q: searchQuery });
  const { data: sdTypes = [] } = useTypes();
  const saveMappingMutation = useSaveTypeMapping();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdpType, setSelectedAdpType] = useState<any | null>(null);
  const [selectedSdTypeId, setSelectedSdTypeId] = useState<string>('');

  const handleOpenModal = (item: any) => {
    setSelectedAdpType(item);
    // Use optional chaining in case sdTypeId is not yet in response, defaults to empty
    setSelectedSdTypeId(item.sdTypeId || '');
    setIsModalOpen(true);
  };

  const handleSaveMapping = () => {
    if (!selectedAdpType || !selectedSdTypeId) return;
    saveMappingMutation.mutate({
        adpTypeId: selectedAdpType.adpTypeId,
        sdTypeId: selectedSdTypeId
    }, {
        onSuccess: () => {
            setIsModalOpen(false);
            toast.success("Type mapping saved");
            refetch();
        }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Vehicle Types</h1>
           <p className="text-slate-500">Map unique ADP Vehicle Types to Internal Classification.</p>
        </div>
        <Button onClick={() => refetch()} variant="secondary">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="max-w-sm relative">
        <Search className="absolute top-3 left-3 text-slate-400" size={18} />
        <Input 
          label="" 
          placeholder="Search..." 
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>ADP Type ID</TableHead>
              <TableHead>English Description</TableHead>
              <TableHead>Arabic Description</TableHead>
              <TableHead>SlashData Mapping</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {(data?.content || []).map((item: any) => {
                const mappedSdType = sdTypes.find(t => t.id === item.sdTypeId);
                return (
                  <TableRow key={item.adpTypeId || item.id} onClick={() => handleOpenModal(item)}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {item.adpTypeId}
                      </span>
                    </TableCell>
                    <TableCell><span className="font-medium text-slate-900">{item.adpTypeName || item.enDescription}</span></TableCell>
                    <TableCell><span className="text-slate-600 font-sans" dir="rtl">{item.arDescription || '-'}</span></TableCell>
                    <TableCell>
                      {mappedSdType ? (
                        <div className="flex items-center gap-2 text-indigo-700 font-medium">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          {mappedSdType.name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Mapped</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mappedSdType ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                           Mapped
                        </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                           <AlertTriangle size={12} /> Pending
                         </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" className="p-2 h-auto text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}>
                        <Link size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
        <Pagination currentPage={page} totalPages={data?.totalPages || 1} onPageChange={setPage} totalItems={data?.totalElements || 0} />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Map ADP Vehicle Type"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMapping} disabled={!selectedSdTypeId}>Save Mapping</Button>
          </>
        }
      >
        <div className="space-y-6">
          {selectedAdpType && (
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">ADP Source Data</div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <span className="text-xs text-slate-500 block">Type ID</span>
                     <span className="font-mono font-medium text-slate-900">{selectedAdpType.adpTypeId}</span>
                   </div>
                   <div>
                     <span className="text-xs text-slate-500 block">Description</span>
                     <span className="font-medium text-slate-900">{selectedAdpType.adpTypeName || selectedAdpType.enDescription}</span>
                   </div>
                </div>
             </div>
          )}
          <div className="space-y-2">
            <SearchableSelect 
               label="Map to Internal Vehicle Type"
               value={selectedSdTypeId}
               onChange={value => setSelectedSdTypeId(value)}
               options={sdTypes.map(t => ({ value: t.id, label: t.name }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};