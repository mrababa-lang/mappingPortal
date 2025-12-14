import React, { useState, useEffect } from 'react';
import { DataService } from '../services/storageService';
import { Make, Model, VehicleType } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, TextArea, Pagination } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, FileText, Search, AlertCircle, AlertTriangle } from 'lucide-react';

export const MakesView: React.FC = () => {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [types, setTypes] = useState<VehicleType[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;
  
  // Form State
  const [formData, setFormData] = useState<Partial<Make>>({ name: '', nameAr: '' });
  
  // Bulk State
  const [bulkData, setBulkData] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const refreshData = () => {
    setMakes(DataService.getMakes());
    setModels(DataService.getModels());
    setTypes(DataService.getTypes());
  };

  const handleOpenModal = (make?: Make) => {
    setError(null);
    if (make) {
      setEditingId(make.id);
      setFormData(make);
    } else {
      setEditingId(null);
      setFormData({ name: '', nameAr: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setError(null);
    if (!formData.name) {
        setError("Make name is required.");
        return;
    }

    // Validation: Check for duplicates
    const duplicate = makes.find(m => 
        m.name.trim().toLowerCase() === formData.name!.trim().toLowerCase() && 
        m.id !== editingId
    );

    if (duplicate) {
        setError(`A manufacturer with the name "${formData.name}" already exists.`);
        return;
    }

    let updatedMakes = [...makes];

    if (editingId) {
      updatedMakes = makes.map(m => m.id === editingId ? { ...m, ...formData } as Make : m);
    } else {
      const newMake: Make = {
        id: Date.now().toString(),
        name: formData.name!,
        nameAr: formData.nameAr || ''
      };
      updatedMakes.push(newMake);
    }

    DataService.saveMakes(updatedMakes);
    setMakes(updatedMakes); // Immediate Update
    setIsModalOpen(false);
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const id = itemToDelete;

    // 1. Delete associated Models
    const allModels = DataService.getModels();
    const modelsToDelete = allModels.filter(m => m.makeId === id);
    const modelIdsToDelete = new Set(modelsToDelete.map(m => m.id));
    const remainingModels = allModels.filter(m => m.makeId !== id);
    DataService.saveModels(remainingModels);
    setModels(remainingModels);

    // 2. Clean up Mappings (Remove mappings referencing deleted models or this make)
    const allMappings = DataService.getADPMappings();
    const updatedMappings = allMappings.filter(m => {
        // Keep mapping only if it DOES NOT link to a deleted model AND DOES NOT link to this make
        const linksToDeletedModel = m.modelId && modelIdsToDelete.has(m.modelId);
        const linksToDeletedMake = m.makeId === id;
        return !linksToDeletedModel && !linksToDeletedMake;
    });
    DataService.saveADPMappings(updatedMappings);

    // 3. Delete Make
    const remainingMakes = makes.filter(m => m.id !== id);
    DataService.saveMakes(remainingMakes);
    setMakes(remainingMakes);
    
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
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
    const newMakes: Make[] = [];
    const existingNames = new Set(makes.map(m => m.name.toLowerCase()));
    
    lines.forEach(line => {
      // CSV Format: Name, NameAr
      const parts = line.split(',');
      if (parts.length < 1) return;
      
      const name = parts[0].trim();
      const nameAr = parts.length > 1 ? parts[1].trim() : '';
      
      if (!name) return;

      if (existingNames.has(name.toLowerCase())) {
        return;
      }
      
      existingNames.add(name.toLowerCase());
      
      newMakes.push({
        id: Date.now() + Math.random().toString(),
        name,
        nameAr
      });
    });

    if (newMakes.length > 0) {
      const updated = [...makes, ...newMakes];
      DataService.saveMakes(updated);
      setMakes(updated);
      setIsBulkOpen(false);
      setBulkData('');
    } else {
      alert("No valid new data found. Duplicates were skipped.");
    }
  };

  // Filter Logic
  const filteredMakes = makes.filter(make => {
    const query = searchQuery.toLowerCase();
    return make.name.toLowerCase().includes(query) ||
           (make.nameAr && make.nameAr.includes(searchQuery)) ||
           make.id.toLowerCase().includes(query);
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMakes.length / ITEMS_PER_PAGE);
  const paginatedMakes = filteredMakes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Vehicle Makes</h1>
           <p className="text-slate-500">Manage manufacturers in English and Arabic.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsBulkOpen(true)}>
            <Upload size={18} />
            Bulk Import
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Make
          </Button>
        </div>
      </div>

      <div className="max-w-sm relative">
        <Search className="absolute top-3 left-3 text-slate-400" size={18} />
        <Input 
          label="" 
          placeholder="Search by make or ID..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>ID</TableHead>
              <TableHead>Make Name (En)</TableHead>
              <TableHead>Make Name (Ar)</TableHead>
              <TableHead>Associated Types</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {paginatedMakes.map(make => {
                const linkedModels = models.filter(m => m.makeId === make.id);
                const uniqueTypeIds = Array.from(new Set(linkedModels.map(m => m.typeId)));
                const linkedTypes = uniqueTypeIds
                  .map(id => types.find(t => t.id === id))
                  .filter((t): t is VehicleType => !!t);

                return (
                  <TableRow key={make.id} onClick={() => handleOpenModal(make)}>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-400">{make.id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{make.name}</div>
                    </TableCell>
                    <TableCell>
                      {make.nameAr ? (
                        <div className="text-slate-700 font-sans" dir="rtl">{make.nameAr}</div>
                      ) : (
                        <span className="text-slate-300 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {linkedTypes.length > 0 ? (
                          linkedTypes.map(type => (
                            <span key={type.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {type.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-300 italic">No models mapped</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="p-2 h-auto" onClick={(e) => handleOpenModal(make)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" className="p-2 h-auto text-red-500 hover:bg-red-50 hover:text-red-600" onClick={(e) => initiateDelete(make.id, e)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredMakes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    {makes.length === 0 ? 'No makes found. Click "Add Make" to create one.' : 'No matches found.'}
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

      {/* Edit/Create Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Make' : 'Add New Make'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
             <Input 
                label="Make Name (English)" 
                value={formData.name} 
                onChange={e => {
                    setFormData({...formData, name: e.target.value});
                    setError(null);
                }}
                placeholder="e.g. Toyota"
              />
              <Input 
                label="Make Name (Arabic)" 
                value={formData.nameAr} 
                onChange={e => setFormData({...formData, nameAr: e.target.value})}
                placeholder="تويوتا"
                dir="rtl"
              />
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
            <Button variant="danger" onClick={confirmDelete}>Delete Permanently</Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
             <AlertTriangle size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Manufacturer?</h3>
           <p className="text-slate-500 text-sm">
             Are you sure you want to delete this Make? <br/>
             <strong className="text-red-600">Warning:</strong> This will also permanently delete <strong>all associated models</strong> and remove their mappings. This action cannot be undone.
           </p>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Import Makes"
        footer={
          <>
             <Button variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
             <Button onClick={handleBulkImport}>Import Makes</Button>
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
             <div className="mt-3 text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded">
              Format: Name (En), Name (Ar)<br/>
              Example: Tesla, تسلا
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