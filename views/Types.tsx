import React, { useState, useEffect } from 'react';
import { generateDescription } from '../services/geminiService';
import { VehicleType } from '../types';
import { Card, Button, Input, TextArea, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, FileText, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { useTypes, useCreateType, useUpdateType, useDeleteType, useBulkImportTypes } from '../hooks/useVehicleData';
import { toast } from 'sonner';

export const TypesView: React.FC = () => {
  // Hooks
  const { data: types = [], isLoading: isLoadingTypes } = useTypes();
  const createType = useCreateType();
  const updateType = useUpdateType();
  const deleteType = useDeleteType();
  const bulkImportTypes = useBulkImportTypes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const ITEMS_PER_PAGE = 20;
  
  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<VehicleType>>({ name: '', nameAr: '', description: '', descriptionAr: '' });
  
  // Bulk State
  const [bulkData, setBulkData] = useState('');

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleOpenModal = (type?: VehicleType) => {
    if (type) {
      setEditingId(type.id);
      setFormData(type);
    } else {
      setEditingId(null);
      setFormData({ name: '', nameAr: '', description: '', descriptionAr: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Type name is required.");
      return;
    }

    if (editingId) {
      updateType.mutate({ ...formData, id: editingId } as VehicleType, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("Type updated successfully");
        },
        onError: () => toast.error("Failed to update type")
      });
    } else {
      createType.mutate({
        id: Date.now().toString(),
        name: formData.name!,
        nameAr: formData.nameAr || '',
        description: formData.description || '',
        descriptionAr: formData.descriptionAr || ''
      }, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("Type created successfully");
        },
        onError: () => toast.error("Failed to create type")
      });
    }
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
    const newTypes: VehicleType[] = [];
    
    lines.forEach(line => {
      // CSV Format: Name, Description
      const parts = line.split(',');
      if (parts.length < 1) return;
      
      const name = parts[0].trim();
      const description = parts.slice(1).join(',').trim() || ''; // Join remaining parts for description
      
      if (!name) return;
      
      newTypes.push({
        id: Date.now() + Math.random().toString(),
        name,
        description
      });
    });

    if (newTypes.length > 0) {
      bulkImportTypes.mutate(newTypes, {
        onSuccess: () => {
          setIsBulkOpen(false);
          setBulkData('');
          toast.success(`Successfully imported ${newTypes.length} types.`);
        },
        onError: () => toast.error("Failed to import types")
      });
    } else {
      toast.info("No valid data found.");
    }
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    deleteType.mutate(itemToDelete, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        toast.success("Type deleted successfully");
      },
      onError: () => toast.error("Failed to delete type")
    });
  };

  const handleAIGenerate = async () => {
    if (!formData.name) {
      toast.error("Please enter a name first.");
      return;
    }
    setIsGenerating(true);
    const desc = await generateDescription(formData.name, "type");
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  // Filter Logic
  const filteredTypes = types.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.nameAr && t.nameAr.includes(searchQuery)) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredTypes.length / ITEMS_PER_PAGE);
  const paginatedTypes = filteredTypes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isLoadingTypes) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Vehicle Types</h1>
           <p className="text-slate-500">Classifications for vehicle body styles.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsBulkOpen(true)}>
            <Upload size={18} />
            Bulk Import
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Type
          </Button>
        </div>
      </div>

      <div className="max-w-sm relative">
        <Search className="absolute top-3 left-3 text-slate-400" size={18} />
        <Input 
          label="" 
          placeholder="Search by name or description..." 
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
              <TableHead>Type Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {paginatedTypes.map(type => (
                <TableRow key={type.id} onClick={() => handleOpenModal(type)}>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-400">{type.id}</span>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded w-fit">{type.name}</span>
                        {type.nameAr && <span className="text-xs text-slate-500" dir="rtl">{type.nameAr}</span>}
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xl">
                        <p className="truncate text-slate-500">{type.description}</p>
                        {type.descriptionAr && <p className="truncate text-slate-400 text-xs mt-1" dir="rtl">{type.descriptionAr}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="p-2 h-auto" onClick={(e) => handleOpenModal(type)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" className="p-2 h-auto text-red-500 hover:bg-red-50 hover:text-red-600" onClick={(e) => initiateDelete(type.id, e)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTypes.length === 0 && (
                 <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
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
          totalItems={filteredTypes.length}
        />
      </Card>

      {/* Edit/Create Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Vehicle Type' : 'Add New Type'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={createType.isPending || updateType.isPending}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
                label="Type Name (En)" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Convertible"
            />
            <Input 
                label="Type Name (Ar)" 
                value={formData.nameAr} 
                onChange={e => setFormData({...formData, nameAr: e.target.value})}
                placeholder="مكشوفة"
                dir="rtl"
            />
          </div>
          <div className="relative">
            <TextArea 
              label="Description (En)" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Description of the vehicle type..."
            />
            <div className="absolute top-0 right-0">
               <Button 
                 variant="ai" 
                 type="button" 
                 onClick={handleAIGenerate} 
                 isLoading={isGenerating}
                 className="text-xs py-1 px-2 h-auto"
                 title="Auto-generate description"
               >
                 AI Generate
               </Button>
            </div>
          </div>
          <TextArea 
              label="Description (Ar)" 
              value={formData.descriptionAr} 
              onChange={e => setFormData({...formData, descriptionAr: e.target.value})}
              placeholder="وصف نوع المركبة..."
              dir="rtl"
            />
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
            <Button variant="danger" onClick={confirmDelete} isLoading={deleteType.isPending}>Delete Type</Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
             <AlertTriangle size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Vehicle Type?</h3>
           <p className="text-slate-500 text-sm">
             Are you sure you want to delete this Vehicle Type? <br/>
             This action cannot be undone.
           </p>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Import Types"
        footer={
          <>
             <Button variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
             <Button onClick={handleBulkImport} isLoading={bulkImportTypes.isPending}>Import Types</Button>
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
              Format: Name, Description<br/>
              Example: Station Wagon, A car with a large cargo area.
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