import React, { useState, useEffect } from 'react';
import { DataService } from '../services/storageService';
import { suggestModels } from '../services/geminiService';
import { Model, Make, VehicleType } from '../types';
import { Card, Button, Input, Select, Modal, TableHeader, TableHead, TableRow, TableCell, TextArea, Pagination } from '../components/UI';
import { Plus, Trash2, Edit2, Sparkles, Upload, FileText, Search, AlertCircle, AlertTriangle, Filter, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Define Zod Schema
const modelSchema = z.object({
  makeId: z.string().min(1, "Manufacturer (Make) is required."),
  typeId: z.string().min(1, "Vehicle Type is required."),
  name: z.string().min(1, "Model Name is required."),
  nameAr: z.string().optional(),
});

type ModelFormData = z.infer<typeof modelSchema>;

export const ModelsView: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [types, setTypes] = useState<VehicleType[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');
  
  const ITEMS_PER_PAGE = 20;

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Bulk State
  const [bulkData, setBulkData] = useState('');

  // Form Setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema),
    defaultValues: { name: '', nameAr: '', makeId: '', typeId: '' }
  });

  const selectedMakeId = watch('makeId');

  useEffect(() => {
    refreshData();
  }, []);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTypeFilter]);

  const refreshData = () => {
    setModels(DataService.getModels());
    setMakes(DataService.getMakes());
    setTypes(DataService.getTypes());
  };

  const handleOpenModal = (model?: Model) => {
    setAiSuggestions([]);
    if (model) {
      setEditingId(model.id);
      reset({
        makeId: model.makeId,
        typeId: model.typeId,
        name: model.name,
        nameAr: model.nameAr || ''
      });
    } else {
      setEditingId(null);
      reset({ name: '', nameAr: '', makeId: '', typeId: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: ModelFormData) => {
    // Validation: Check for duplicates (Make + Model combination)
    const duplicate = models.find(m => 
        m.makeId === data.makeId &&
        m.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        m.id !== editingId
    );

    if (duplicate) {
        toast.error(`This model already exists for the selected manufacturer.`);
        return;
    }

    let updatedModels = [...models];

    if (editingId) {
      updatedModels = models.map(m => m.id === editingId ? { ...m, ...data, id: m.id } as Model : m);
    } else {
      const newModel: Model = {
        id: Date.now().toString(),
        name: data.name,
        nameAr: data.nameAr || '',
        makeId: data.makeId,
        typeId: data.typeId
      };
      updatedModels.push(newModel);
    }

    DataService.saveModels(updatedModels);
    setModels(updatedModels);
    setIsModalOpen(false);
    toast.success(editingId ? "Model updated successfully" : "Model created successfully");
  };

  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const id = itemToDelete;

    // 1. Clean up Mappings
    const allMappings = DataService.getADPMappings();
    const updatedMappings = allMappings.filter(m => m.modelId !== id);
    DataService.saveADPMappings(updatedMappings);

    // 2. Delete Model
    const remainingModels = models.filter(m => m.id !== id);
    DataService.saveModels(remainingModels);
    setModels(remainingModels);

    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    toast.success("Model deleted successfully");
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
    const newModels: Model[] = [];
    
    // Create a set of existing makeId+modelName to prevent duplicates
    const existingKeys = new Set(models.map(m => `${m.makeId}:${m.name.toLowerCase()}`));

    lines.forEach(line => {
      // CSV Format: Name, MakeName, TypeName
      const parts = line.split(',');
      if (parts.length < 3) return;
      
      const name = parts[0].trim();
      const makeName = parts[1].trim();
      const typeName = parts[2].trim();
      
      if (!name || !makeName || !typeName) return;
      
      // Resolve IDs (Case insensitive matching)
      const make = makes.find(m => m.name.toLowerCase() === makeName.toLowerCase());
      const type = types.find(t => t.name.toLowerCase() === typeName.toLowerCase());
      
      if (make && type) {
        const key = `${make.id}:${name.toLowerCase()}`;
        if (!existingKeys.has(key)) {
           newModels.push({
             id: Date.now() + Math.random().toString(),
             name,
             makeId: make.id,
             typeId: type.id
           });
           existingKeys.add(key); // Add to set to prevent duplicates in current bulk
        }
      }
    });

    if (newModels.length > 0) {
      const updated = [...models, ...newModels];
      DataService.saveModels(updated);
      setModels(updated);
      setIsBulkOpen(false);
      setBulkData('');
      toast.success(`Successfully imported ${newModels.length} models.`);
    } else {
      toast.info("No valid new models found. Duplicates were skipped or Make/Type names did not match.");
    }
  };

  const handleAISuggest = async () => {
    const make = makes.find(m => m.id === selectedMakeId);
    if (!make) {
      toast.error("Please select a Make first.");
      return;
    }
    
    setIsSuggesting(true);
    const suggestions = await suggestModels(make.name);
    setAiSuggestions(suggestions);
    setIsSuggesting(false);
  };

  // Filter Logic
  const filteredModels = models.filter(model => {
    const make = makes.find(m => m.id === model.makeId);
    const makeName = make ? make.name.toLowerCase() : '';
    const query = searchQuery.toLowerCase();
    
    // Search Filter
    const matchesSearch = model.name.toLowerCase().includes(query) ||
           (model.nameAr && model.nameAr.includes(searchQuery)) ||
           model.id.toLowerCase().includes(query) ||
           makeName.includes(query);

    // Type Filter
    const matchesType = selectedTypeFilter ? model.typeId === selectedTypeFilter : true;
    
    return matchesSearch && matchesType;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);
  const paginatedModels = filteredModels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Vehicle Models</h1>
           <p className="text-slate-500">Specific models associated with makes.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsBulkOpen(true)}>
            <Upload size={18} />
            Bulk Import
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Model
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="max-w-md w-full relative">
          <Search className="absolute top-3 left-3 text-slate-400" size={18} />
          <Input 
            label="" 
            placeholder="Search by model, make or ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-64">
           <div className="relative">
              <Select 
                label=""
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Vehicle Types' },
                  ...types.map(t => ({ value: t.id, label: t.name }))
                ]}
                className="py-2.5"
              />
              <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none text-slate-400">
                <Filter size={16} />
              </div>
           </div>
        </div>
        {selectedTypeFilter && (
          <Button 
            variant="ghost" 
            className="mb-0.5 px-2 text-slate-400 hover:text-red-500" 
            onClick={() => setSelectedTypeFilter('')}
            title="Clear Type Filter"
          >
            <X size={18} />
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>ID</TableHead>
              <TableHead>Model Name</TableHead>
              <TableHead>Make</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {paginatedModels.map(model => (
                <TableRow key={model.id} onClick={() => handleOpenModal(model)}>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-400">{model.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <div className="font-medium text-slate-900">{model.name}</div>
                        {model.nameAr && <div className="text-xs text-slate-500" dir="rtl">{model.nameAr}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                           {DataService.getMakeName(model.makeId).substring(0, 2).toUpperCase()}
                        </span>
                        {DataService.getMakeName(model.makeId)}
                     </div>
                  </TableCell>
                  <TableCell>{DataService.getTypeName(model.typeId)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="p-2 h-auto" onClick={(e) => handleOpenModal(model)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" className="p-2 h-auto text-red-500 hover:bg-red-50 hover:text-red-600" onClick={(e) => initiateDelete(model.id, e)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredModels.length === 0 && (
                 <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
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
          totalItems={filteredModels.length}
        />
      </Card>

      {/* Edit/Create Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Model' : 'Add New Model'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Select 
              label="Manufacturer (Make)"
              options={makes.map(m => ({ value: m.id, label: m.name }))}
              {...register('makeId')}
            />
            {errors.makeId && <p className="text-red-500 text-xs mt-1 ml-1">{errors.makeId.message}</p>}
          </div>
          
          <div>
            <Select 
              label="Vehicle Type"
              options={types.map(t => ({ value: t.id, label: t.name }))}
              {...register('typeId')}
            />
             {errors.typeId && <p className="text-red-500 text-xs mt-1 ml-1">{errors.typeId.message}</p>}
          </div>

          <div className="space-y-2">
             <div className="flex items-end gap-2">
               <div className="flex-1">
                 <Input 
                   label="Model Name (En)" 
                   placeholder="e.g. Corolla"
                   {...register('name')}
                 />
                 {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message}</p>}
               </div>
               {DataService.getAppConfig().enableAI && (
                 <Button 
                   variant="ai" 
                   type="button"
                   onClick={handleAISuggest} 
                   isLoading={isSuggesting}
                   className="mb-[1px]"
                   title="Suggest popular models for selected Make"
                 >
                   {isSuggesting ? 'Thinking...' : 'AI Suggest'}
                 </Button>
               )}
             </div>
             <Input 
                label="Model Name (Ar)" 
                placeholder="كورولا"
                dir="rtl"
                {...register('nameAr')}
              />
             
             {/* AI Suggestions Chips */}
             {aiSuggestions.length > 0 && (
               <div className="flex gap-2 flex-wrap animate-in fade-in slide-in-from-top-2">
                 <span className="text-xs text-slate-400 flex items-center gap-1"><Sparkles size={10} /> Suggestions:</span>
                 {aiSuggestions.map(s => (
                   <button 
                     key={s} 
                     type="button"
                     onClick={() => setValue('name', s, { shouldValidate: true })}
                     className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs border border-indigo-100 hover:bg-indigo-100 transition-colors"
                   >
                     {s}
                   </button>
                 ))}
               </div>
             )}
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
            <Button variant="danger" onClick={confirmDelete}>Delete Model</Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
             <AlertTriangle size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Vehicle Model?</h3>
           <p className="text-slate-500 text-sm">
             Are you sure you want to delete this Model? <br/>
             This action cannot be undone.
           </p>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Import Models"
        footer={
          <>
             <Button variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
             <Button onClick={handleBulkImport}>Import Models</Button>
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
              Format: Name, Make Name, Type Name<br/>
              Example: Civic, Honda, Sedan
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