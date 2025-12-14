import React, { useState } from 'react';
import { useADPUniqueMakes, useSaveMakeMapping } from '../hooks/useADPData';
import { useMakes } from '../hooks/useVehicleData';
import { Card, Button, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, SearchableSelect, Input } from '../components/UI';
import { Edit2, Link, CheckCircle2, AlertTriangle, RefreshCw, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ADPMakesView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data, isLoading, refetch } = useADPUniqueMakes({ page, size: 20, q: searchQuery });
  const { data: sdMakes = [] } = useMakes();
  const saveMappingMutation = useSaveMakeMapping();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdpMake, setSelectedAdpMake] = useState<any | null>(null);
  const [selectedSdMakeId, setSelectedSdMakeId] = useState<string>('');

  const handleOpenModal = (item: any) => {
    setSelectedAdpMake(item);
    setSelectedSdMakeId(item.sdMakeId || '');
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
            toast.success("Make mapping saved");
            refetch();
        }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Makes</h1>
           <p className="text-slate-500">Manage unique manufacturer mappings from ADP Master Data.</p>
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
              <TableHead>ADP Make ID</TableHead>
              <TableHead>English Description</TableHead>
              <TableHead>Arabic Description</TableHead>
              <TableHead>SlashData Mapping</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {(data?.content || []).map((item: any) => {
                const mappedSdMake = sdMakes.find(m => m.id === item.sdMakeId);
                return (
                  <TableRow key={item.adpMakeId} onClick={() => handleOpenModal(item)}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {item.adpMakeId}
                      </span>
                    </TableCell>
                    <TableCell><span className="font-medium text-slate-900">{item.makeEnDesc}</span></TableCell>
                    <TableCell><span className="text-slate-600 font-sans" dir="rtl">{item.makeArDesc}</span></TableCell>
                    <TableCell>
                      {mappedSdMake ? (
                        <div className="flex items-center gap-2 text-indigo-700 font-medium">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          {mappedSdMake.name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Mapped</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mappedSdMake ? (
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
        title="Map ADP Make"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMapping} disabled={!selectedSdMakeId}>Save Mapping</Button>
          </>
        }
      >
        <div className="space-y-6">
          {selectedAdpMake && (
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">ADP Source Data</div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <span className="text-xs text-slate-500 block">Make ID</span>
                     <span className="font-mono font-medium text-slate-900">{selectedAdpMake.adpMakeId}</span>
                   </div>
                   <div>
                     <span className="text-xs text-slate-500 block">English Desc</span>
                     <span className="font-medium text-slate-900">{selectedAdpMake.makeEnDesc}</span>
                   </div>
                </div>
             </div>
          )}
          <div className="space-y-2">
            <SearchableSelect 
               label="Map to SlashData Make"
               value={selectedSdMakeId}
               onChange={value => setSelectedSdMakeId(value)}
               options={sdMakes.map(m => ({ value: m.id, label: m.name }))}
               placeholder="Search for manufacturer..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};