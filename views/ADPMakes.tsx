import React, { useState, useEffect } from 'react';
import { DataService } from '../services/storageService';
import { ADPMaster, ADPMakeMapping, Make, ADPMapping } from '../types';
import { Card, Button, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, SearchableSelect, Input } from '../components/UI';
import { Edit2, Link, CheckCircle2, AlertTriangle, RefreshCw, Search } from 'lucide-react';

interface UniqueADPMake {
  adpMakeId: string;
  makeEnDesc: string;
  makeArDesc: string;
  sdMakeId?: string; // If mapped
}

export const ADPMakesView: React.FC = () => {
  const [uniqueMakes, setUniqueMakes] = useState<UniqueADPMake[]>([]);
  const [sdMakes, setSdMakes] = useState<Make[]>([]);
  const [makeMappings, setMakeMappings] = useState<ADPMakeMapping[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdpMake, setSelectedAdpMake] = useState<UniqueADPMake | null>(null);
  const [selectedSdMakeId, setSelectedSdMakeId] = useState<string>('');

  // Pagination & Search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    refreshData();
  }, []);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const refreshData = () => {
    const masterData = DataService.getADPMaster();
    const mappings = DataService.getADPMakeMappings();
    const makes = DataService.getMakes();

    setSdMakes(makes);
    setMakeMappings(mappings);

    // Extract unique makes
    const uniqueMap = new Map<string, UniqueADPMake>();
    masterData.forEach(item => {
      if (!uniqueMap.has(item.adpMakeId)) {
        const mappedSdId = mappings.find(m => m.adpMakeId === item.adpMakeId)?.sdMakeId;
        uniqueMap.set(item.adpMakeId, {
          adpMakeId: item.adpMakeId,
          makeEnDesc: item.makeEnDesc,
          makeArDesc: item.makeArDesc,
          sdMakeId: mappedSdId
        });
      }
    });

    setUniqueMakes(Array.from(uniqueMap.values()));
  };

  const handleOpenModal = (item: UniqueADPMake) => {
    setSelectedAdpMake(item);
    setSelectedSdMakeId(item.sdMakeId || '');
    setIsModalOpen(true);
  };

  const handleSaveMapping = () => {
    if (!selectedAdpMake || !selectedSdMakeId) return;

    // 1. Save the Global Make Mapping
    const newMapping: ADPMakeMapping = {
      adpMakeId: selectedAdpMake.adpMakeId,
      sdMakeId: selectedSdMakeId,
      updatedAt: new Date().toISOString()
    };

    // Update or Add to local mapping list
    const updatedMappings = [...makeMappings.filter(m => m.adpMakeId !== selectedAdpMake.adpMakeId), newMapping];
    DataService.saveADPMakeMappings(updatedMappings);

    // 2. Propagate to individual ADP Mappings
    // "Any mapped make should reflect in the adp mapping"
    const adpMaster = DataService.getADPMaster();
    const currentAdpMappings = DataService.getADPMappings();
    const allRelevantAdpIds = adpMaster
        .filter(m => m.adpMakeId === selectedAdpMake.adpMakeId)
        .map(m => m.id);

    const updatedAdpMappings = [...currentAdpMappings];

    allRelevantAdpIds.forEach(adpId => {
       const existingMappingIndex = updatedAdpMappings.findIndex(m => m.adpId === adpId);
       
       if (existingMappingIndex >= 0) {
          // If mapping exists, update makeId if it's currently MISSING_MAKE or MISSING_MODEL
          const existing = updatedAdpMappings[existingMappingIndex];
          if (existing.status === 'MISSING_MAKE') {
             updatedAdpMappings[existingMappingIndex] = {
               ...existing,
               status: 'MISSING_MODEL', // Promoted from Missing Make to Missing Model
               makeId: selectedSdMakeId,
               updatedAt: new Date().toISOString(),
               updatedBy: '1' // Current User
             };
          } else if (existing.status === 'MISSING_MODEL') {
             updatedAdpMappings[existingMappingIndex] = {
               ...existing,
               makeId: selectedSdMakeId, // Update make just in case
               updatedAt: new Date().toISOString(),
               updatedBy: '1'
             };
          }
       } else {
          // If no mapping exists, create one with MISSING_MODEL status (since we only know the Make)
          updatedAdpMappings.push({
            id: Date.now() + Math.random().toString(),
            adpId: adpId,
            makeId: selectedSdMakeId,
            status: 'MISSING_MODEL',
            updatedAt: new Date().toISOString(),
            updatedBy: '1'
          });
       }
    });

    DataService.saveADPMappings(updatedAdpMappings);

    setIsModalOpen(false);
    refreshData();
    alert(`Mapping applied! ${allRelevantAdpIds.length} ADP records updated.`);
  };

  // Filter Logic
  const filteredMakes = uniqueMakes.filter(item => {
     const query = searchQuery.toLowerCase();
     return item.adpMakeId.toLowerCase().includes(query) ||
            item.makeEnDesc.toLowerCase().includes(query) ||
            (item.makeArDesc && item.makeArDesc.includes(searchQuery));
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMakes.length / ITEMS_PER_PAGE);
  const paginatedMakes = filteredMakes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Makes</h1>
           <p className="text-slate-500">Manage unique manufacturer mappings from ADP Master Data.</p>
        </div>
        <Button onClick={refreshData} variant="secondary">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="max-w-sm relative">
        <Search className="absolute top-3 left-3 text-slate-400" size={18} />
        <Input 
          label="" 
          placeholder="Search by ID or description..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
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
              {paginatedMakes.map(item => {
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
              {filteredMakes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No matches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredMakes.length}
        />
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
                   <div className="col-span-2">
                     <span className="text-xs text-slate-500 block">Arabic Desc</span>
                     <span className="font-medium text-slate-900" dir="rtl">{selectedAdpMake.makeArDesc}</span>
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
            <p className="text-xs text-slate-500 mt-2">
               <strong className="text-indigo-600">Note:</strong> Saving this mapping will automatically update all unmapped or 'Missing Make' records in the ADP Mapping table that match this ADP Make ID.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};