
import React, { useState, useEffect } from 'react';
import { useMakes, useModels, useCreateMake, useUpdateMake, useDeleteMake, useBulkImportMakes } from '../hooks/useVehicleData';
import { Make } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, EmptyState, HighlightText, TableSkeleton } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, Search, Loader2, Download, CheckCircle2, AlertTriangle, Car, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { commonValidators } from '../utils/validation';

const makeSchema = z.object({
  id: commonValidators.makeId,
  name: commonValidators.requiredString,
  nameAr: commonValidators.arabicText,
});
type MakeFormData = z.infer<typeof makeSchema>;

export const MakesView: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useMakes({ 
    page: currentPage, 
    size: 20, 
    q: debouncedSearch 
  });
  
  const { data: modelsData } = useModels();
  const models = Array.isArray(modelsData) ? modelsData : [];
  
  const createMake = useCreateMake();
  const updateMake = useUpdateMake();
  const deleteMake = useDeleteMake();
  const bulkImportMakes = useBulkImportMakes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MakeFormData>({
    resolver: zodResolver(makeSchema),
    defaultValues: { id: '', name: '', nameAr: '' }
  });

  const handleOpenModal = (make?: Make) => {
    if (make) {
      setEditingId(make.id);
      reset({ id: make.id, name: make.name, nameAr: make.nameAr || '' });
    } else {
      setEditingId(null);
      reset({ id: '', name: '', nameAr: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (formData: MakeFormData) => {
    if (editingId) {
      updateMake.mutate({ ...formData, id: editingId } as Make, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("Make updated");
        }
      });
    } else {
      createMake.mutate(formData, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("Make created");
        }
      });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
        const hasModels = models.some(m => {
            const mMakeId = m.makeId || (m.make && m.make.id);
            return String(mMakeId) === String(itemToDelete);
        });

        if (hasModels) {
            toast.error("Cannot delete: This manufacturer has associated vehicle models.");
            setIsDeleteModalOpen(false);
            return;
        }

      deleteMake.mutate(itemToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
          toast.success("Make deleted successfully");
        }
      });
    }
  };

  const handleBulkImport = () => {
    if (bulkFile) {
        bulkImportMakes.mutate(bulkFile, {
            onSuccess: (response: any) => {
                setUploadResult(response);
                setBulkFile(null);
                toast.success("Bulk import complete");
            },
            onError: (err: any) => {
                toast.error(err.message || "Failed to process import");
            }
        });
    }
  };

  const handleCloseBulk = () => {
    setIsBulkOpen(false);
    setBulkFile(null);
    setUploadResult(null);
  };

  const handleDownloadSample = () => {
    const headers = "id,name,nameAr";
    const sample = "TOY,Toyota,تويوتا";
    const csvContent = "\uFEFF" + headers + "\n" + sample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "makes_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const makesList = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalElements || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Vehicle Makes</h1>
           <p className="text-slate-500">Manage manufacturers and source system identifiers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsBulkOpen(true)}><Upload size={18} /> Bulk Import</Button>
          <Button onClick={() => handleOpenModal()}><Plus size={18} /> Add Make</Button>
        </div>
      </div>

      <Card className="p-4 border-slate-200">
        <div className="max-w-md relative">
            <Search className="absolute top-3 left-3 text-slate-400" size={18} />
            <Input 
                label="" 
                placeholder="Search by name or ID..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-10" 
            />
            {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                    <X size={16} />
                </button>
            )}
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        {isLoading ? <TableSkeleton rows={10} cols={4} /> : (
        <>
            {totalItems === 0 ? (
                <EmptyState 
                   icon={Car} 
                   title={debouncedSearch ? "No Matches Found" : "No Makes Defined"} 
                   description={debouncedSearch ? `Adjust your search criteria for "${debouncedSearch}".` : "Start by adding a vehicle manufacturer or importing a CSV list."}
                   action={!debouncedSearch ? <Button onClick={() => handleOpenModal()}><Plus size={16}/> Create First Make</Button> : null}
                />
            ) : (
                <>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <TableHeader>
                            <TableHead className="w-24">ID</TableHead>
                            <TableHead>Manufacturer Name (En)</TableHead>
                            <TableHead>Arabic Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableHeader>
                        <tbody>
                            {makesList.map((make: Make) => (
                                <TableRow key={make.id} onClick={() => handleOpenModal(make)}>
                                    <TableCell>
                                        <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                          <HighlightText text={make.id} highlight={debouncedSearch} />
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-bold text-slate-900">
                                        <HighlightText text={make.name} highlight={debouncedSearch} />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-sans text-slate-600" dir="rtl">
                                        <HighlightText text={make.nameAr || '-'} highlight={debouncedSearch} />
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenModal(make)}><Edit2 size={16} className="text-slate-400 hover:text-indigo-600" /></Button>
                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => { setItemToDelete(make.id); setIsDeleteModalOpen(true); }}><Trash2 size={16} className="text-slate-400 hover:text-red-500" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} />
                </>
            )}
        </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Manufacturer' : 'New Manufacturer'} footer={
        <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} className="px-8">Save Record</Button>
        </>
      }>
        <div className="space-y-4">
            <Input label="Make ID (UPPERCASE)" {...register('id')} disabled={!!editingId} placeholder="e.g. TOY" error={errors.id?.message as string} className="font-mono" />
            <Input label="English Name" {...register('name')} placeholder="e.g. Toyota" error={errors.name?.message as string} />
            <Input label="Arabic Name" {...register('nameAr')} dir="rtl" placeholder="تويوتا" error={errors.nameAr?.message as string} className="font-sans" />
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Removal" footer={
        <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Remove Make</Button>
        </>
      }>
         <div className="py-2 text-slate-600">
             Are you sure you want to delete <span className="font-bold text-slate-900">{itemToDelete}</span>? This action is permanent and only possible if no models are linked.
         </div>
      </Modal>

      <Modal isOpen={isBulkOpen} onClose={handleCloseBulk} title="Bulk Synchronizer" footer={
         !uploadResult ? (
           <><Button variant="secondary" onClick={handleCloseBulk}>Cancel</Button><Button onClick={handleBulkImport} isLoading={bulkImportMakes.isPending}>Upload CSV</Button></>
         ) : (
           <Button onClick={handleCloseBulk}>Finish</Button>
         )
      }>
         {!uploadResult ? (
           <div className="space-y-5">
               <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                   <div>
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Data Template</span>
                      <span className="text-xs text-indigo-500">Download the required structure.</span>
                   </div>
                   <Button variant="secondary" onClick={handleDownloadSample} className="h-9 text-xs gap-2 border-indigo-200">
                      <Download size={14}/> CSV Template
                   </Button>
               </div>
               
               <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer relative">
                   <Upload size={32} className="text-slate-300 mb-3 group-hover:text-indigo-400 transition-colors" />
                   <p className="text-sm font-bold text-slate-600">Select File to Import</p>
                   <p className="text-xs text-slate-400 mt-1">Accepts .csv (UTF-8)</p>
                   <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                   {bulkFile && (
                       <div className="mt-4 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
                           <CheckCircle2 size={12}/> {bulkFile.name}
                       </div>
                   )}
               </div>
           </div>
         ) : (
           <div className="space-y-6 py-4">
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${uploadResult.recordsSkipped > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                 <div className={`p-3 rounded-xl ${uploadResult.recordsSkipped > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {uploadResult.recordsSkipped > 0 ? <AlertTriangle size={24}/> : <CheckCircle2 size={24}/>}
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800">Processing Complete</h3>
                    <p className="text-sm text-slate-500">The manufacturer master list has been updated.</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                    <span className="block text-3xl font-black text-emerald-600 mb-1">{uploadResult.recordsAdded || 0}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Added / Updated</span>
                 </div>
                 <div className="p-6 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                    <span className="block text-3xl font-black text-amber-500 mb-1">{uploadResult.recordsSkipped || 0}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Skipped (Conflict)</span>
                 </div>
              </div>
           </div>
         )}
      </Modal>
    </div>
  );
};
