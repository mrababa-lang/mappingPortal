import React, { useState, useEffect } from 'react';
import { DataService } from '../services/storageService';
import { ADPMaster } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, TextArea, Pagination } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, FileText, Search, AlertTriangle } from 'lucide-react';

export const ADPMasterView: React.FC = () => {
  const [adpList, setAdpList] = useState<ADPMaster[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkData, setBulkData] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const ITEMS_PER_PAGE = 20;

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<ADPMaster>>({ 
    adpMakeId: '', makeEnDesc: '', makeArDesc: '', 
    adpModelId: '', modelEnDesc: '', modelArDesc: '',
    adpTypeId: '', typeEnDesc: '', typeArDesc: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const refreshData = () => {
    setAdpList(DataService.getADPMaster());
  };

  const handleOpenModal = (item?: ADPMaster) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      setFormData({ 
        adpMakeId: '', makeEnDesc: '', makeArDesc: '', 
        adpModelId: '', modelEnDesc: '', modelArDesc: '',
        adpTypeId: '', typeEnDesc: '', typeArDesc: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.adpMakeId || !formData.adpModelId || !formData.adpTypeId) return;

    let updatedList = [...adpList];
    if (editingId) {
      updatedList = adpList.map(item => item.id === editingId ? { ...item, ...formData } as ADPMaster : item);
    } else {
      const newItem: ADPMaster = {
        id: Date.now().toString(),
        adpMakeId: formData.adpMakeId!,
        makeEnDesc: formData.makeEnDesc!,
        makeArDesc: formData.makeArDesc!,
        adpModelId: formData.adpModelId!,
        modelEnDesc: formData.modelEnDesc!,
        modelArDesc: formData.modelArDesc!,
        adpTypeId: formData.adpTypeId!,
        typeEnDesc: formData.typeEnDesc!,
        typeArDesc: formData.typeArDesc!
      };
      updatedList.push(newItem);
    }
    DataService.saveADPMaster(updatedList);
    setAdpList(updatedList);
    setIsModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkData(content);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = () => {
    if (!bulkData.trim()) return;
    
    const lines = bulkData.split('\n');
    const newItems: ADPMaster[] = [];
    
    lines.forEach(line => {
      // CSV: MakeID, MakeEn, MakeAr, ModelID, ModelEn, ModelAr, TypeID, TypeEn, TypeAr
      const parts = line.split(',');
      if (parts.length < 9) return;
      
      newItems.push({
        id: Date.now() + Math.random().toString(),
        adpMakeId: parts[0].trim(),
        makeEnDesc: parts[1].trim(),
        makeArDesc: parts[2].trim(),
        adpModelId: parts[3].trim(),
        modelEnDesc: parts[4].trim(),
        modelArDesc: parts[5].trim(),
        adpTypeId: parts[6].trim(),
        typeEnDesc: parts[7].trim(),
        typeArDesc: parts[8].trim()
      });
    });

    if (newItems.length > 0) {
      const updated = [...adpList, ...newItems];
      DataService.saveADPMaster(updated);
      setAdpList(updated);
      setIsBulkOpen(false);
      setBulkData('');
    } else {
      alert("No valid data found or invalid format.");
    }
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const id = itemToDelete;

    // Fetch fresh data
    const currentMaster = DataService.getADPMaster();
    const currentMappings = DataService.getADPMappings();

    // 1. Delete Mappings related to this ADP Item
    const updatedMappings = currentMappings.filter(m => m.adpId !== id);
    DataService.saveADPMappings(updatedMappings);

    // 2. Delete ADP Item
    const filtered = currentMaster.filter(item => item.id !== id);
    DataService.saveADPMaster(filtered);
    
    setAdpList(filtered);
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // Filter Logic
  const filteredItems = adpList.filter(item => {
    const query = searchQuery.toLowerCase();
    return item.adpMakeId.toLowerCase().includes(query) ||
           item.makeEnDesc.toLowerCase().includes(query) ||
           item.adpModelId.toLowerCase().includes(query) ||
           item.modelEnDesc.toLowerCase().includes(query) ||
           (item.makeArDesc && item.makeArDesc.includes(query)) ||
           (item.modelArDesc && item.modelArDesc.includes(query));
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedList = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Master List</h1>
           <p className="text-slate-500">Manage ADP Make, Model, and Type definitions.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsBulkOpen(true)}>
            <Upload size={18} />
            Bulk Upload
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Entry
          </Button>
        </div>
      </div>

      <div className="max-w-sm relative">
        <Search className="absolute top-3 left-3 text-slate-400" size={18} />
        <Input 
          label="" 
          placeholder="Search ADP ID, Make or Model..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>Make</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {paginatedList.map(item => (
                <TableRow key={item.id} onClick={() => handleOpenModal(item)}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-slate-500 mb-1">{item.adpMakeId}</span>
                      <span className="font-medium text-slate-900">{item.makeEnDesc}</span>
                      <span className="text-xs text-slate-500" dir="rtl">{item.makeArDesc}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-slate-500 mb-1">{item.adpModelId}</span>
                      <span className="font-medium text-slate-900">{item.modelEnDesc}</span>
                      <span className="text-xs text-slate-500" dir="rtl">{item.modelArDesc}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-slate-500 mb-1">{item.adpTypeId}</span>
                      <span className="font-medium text-slate-900">{item.typeEnDesc}</span>
                      <span className="text-xs text-slate-500" dir="rtl">{item.typeArDesc}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="p-2 h-auto" onClick={(e) => handleOpenModal(item)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" className="p-2 h-auto text-red-500 hover:bg-red-50 hover:text-red-600" onClick={(e) => initiateDelete(item.id, e)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No ADP entries found matching your search.
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
          totalItems={filteredItems.length}
        />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit ADP Entry' : 'Add ADP Entry'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Make Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Make Details</h4>
            <div className="grid grid-cols-3 gap-3">
              <Input label="ID" value={formData.adpMakeId} onChange={e => setFormData({...formData, adpMakeId: e.target.value})} placeholder="TOY" />
              <Input label="Desc (En)" value={formData.makeEnDesc} onChange={e => setFormData({...formData, makeEnDesc: e.target.value})} placeholder="Toyota" />
              <Input label="Desc (Ar)" value={formData.makeArDesc} onChange={e => setFormData({...formData, makeArDesc: e.target.value})} placeholder="تويوتا" dir="rtl" />
            </div>
          </div>

          {/* Model Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Model Details</h4>
            <div className="grid grid-cols-3 gap-3">
              <Input label="ID" value={formData.adpModelId} onChange={e => setFormData({...formData, adpModelId: e.target.value})} placeholder="CAM" />
              <Input label="Desc (En)" value={formData.modelEnDesc} onChange={e => setFormData({...formData, modelEnDesc: e.target.value})} placeholder="Camry" />
              <Input label="Desc (Ar)" value={formData.modelArDesc} onChange={e => setFormData({...formData, modelArDesc: e.target.value})} placeholder="كامري" dir="rtl" />
            </div>
          </div>

          {/* Type Section */}
          <div className="space-y-2">
             <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-1">Type Details</h4>
             <div className="grid grid-cols-3 gap-3">
              <Input label="ID" value={formData.adpTypeId} onChange={e => setFormData({...formData, adpTypeId: e.target.value})} placeholder="SED" />
              <Input label="Desc (En)" value={formData.typeEnDesc} onChange={e => setFormData({...formData, typeEnDesc: e.target.value})} placeholder="Sedan" />
              <Input label="Desc (Ar)" value={formData.typeArDesc} onChange={e => setFormData({...formData, typeArDesc: e.target.value})} placeholder="سيدان" dir="rtl" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete Entry</Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
             <AlertTriangle size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">Delete ADP Entry?</h3>
           <p className="text-slate-500 text-sm">
             Are you sure you want to delete this record? <br/>
             This will remove any existing mappings associated with this vehicle.
           </p>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Import ADP Data"
        footer={
          <>
             <Button variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
             <Button onClick={handleBulkImport}>Import Data</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="flex items-center gap-2 mb-3">
               <FileText size={18} className="text-slate-500" />
               <h4 className="font-semibold text-slate-700 text-sm">Upload CSV File</h4>
             </div>
             <input 
               type="file" 
               accept=".csv,.txt"
               onChange={handleFileUpload}
               className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-700 file:shadow-sm hover:file:bg-slate-100 cursor-pointer"
             />
             <div className="mt-3 text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded overflow-x-auto whitespace-pre">
              Order: MakeID, MakeEn, MakeAr, ModelID, ModelEn, ModelAr, TypeID, TypeEn, TypeAr<br/>
              Example: TOY,Toyota,تويوتا,CAM,Camry,كامري,SED,Sedan,سيدان
            </div>
          </div>
          
          <div className="relative border-t border-slate-200 pt-6">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-xs font-medium text-slate-400">OR PASTE MANUALY</div>
             <TextArea 
                label="CSV Content"
                placeholder="Paste CSV data here..."
                value={bulkData}
                onChange={e => setBulkData(e.target.value)}
                className="font-mono text-xs min-h-[150px]"
              />
          </div>
        </div>
      </Modal>
    </div>
  );
};