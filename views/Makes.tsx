import React, { useState } from 'react';
import { useMakes, useModels, useTypes, useCreateMake, useUpdateMake, useDeleteMake, useBulkImportMakes } from '../hooks/useVehicleData';
import { Make } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, EmptyState } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, Search, Loader2, Download, CheckCircle2, AlertTriangle, Car } from 'lucide-react';
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
  const { data: makes = [], isLoading } = useMakes();
  const { data: models = [] } = useModels();
  
  const createMake = useCreateMake();
  const updateMake = useUpdateMake();
  const deleteMake = useDeleteMake();
  const bulkImportMakes = useBulkImportMakes();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const ITEMS_PER_PAGE = 20;

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

  const onSubmit = (data: MakeFormData) => {
    if (editingId) {
      updateMake.mutate({ ...data, id: editingId } as Make, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("Make updated");
        }
      });
    } else {
      createMake.mutate(data, {
        onSuccess: () => {
          setIsModalOpen(false);
          toast.success("Make created");
        }
      });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
        // Validation check for associated models
        const hasModels = models.some(m => {
            const makeId = m.makeId || (m.make && m.make.id);
            return makeId === itemToDelete;
        });

        if (hasModels) {
            toast.error("Cannot delete Make: It has associated models. Please delete models first.");
            setIsDeleteModalOpen(false);
            return;
        }

      deleteMake.mutate(itemToDelete, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
          toast.success("Make deleted");
        }
      });
    }
  };

  const handleBulkImport = () => {
    if (bulkFile) {
        bulkImportMakes.mutate(bulkFile, {
            onSuccess: (response: any) => {
                const resultData = response.data || response;
                setUploadResult(resultData);
                setBulkFile(null);
                toast.success("Import processed.");
            },
            onError: (err: any) => {
                toast.error(err.message || "Failed to upload file.");
            }
        });
    }
  };

  const handleCloseBulk = () => {
    setIsBulkOpen(false);
    setBulkFile(null);
    setUploadResult(null);
    bulkImportMakes.reset();
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

  // Filter & Pagination
  const filteredMakes = makes.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.nameAr && m.nameAr.includes(searchQuery))
  );
  const totalPages = Math.ceil(filteredMakes.length / ITEMS_PER_PAGE);
  const paginatedMakes = filteredMakes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Vehicle Makes</h1>
           <p className="text-slate-500">Manage manufacturers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsBulkOpen(true)}><Upload size={18} /> Bulk Import</Button>
          <Button onClick={() => handleOpenModal()}><Plus size={18} /> Add Make</Button>
        </div>
      </div>

      <div className="max-w-md relative">
        <Search className="absolute top-3 left-3 text-slate-400" size={18} />
        <Input label="" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Card className="overflow-hidden">
        {makes.length === 0 ? (
            <EmptyState 
               icon={Car} 
               title="No Makes Found" 
               description="Start by adding a vehicle manufacturer or importing a list."
               action={<Button onClick={() => handleOpenModal()}><Plus size={16}/> Create First Make</Button>}
            />
        ) : filteredMakes.length === 0 ? (
            <EmptyState 
               icon={Search} 
               title="No Matches" 
               description={`No makes found matching "${searchQuery}".`}
            />
        ) : (
            <>
            <div className="overflow-x-auto">
            <table className="w-full">
                <TableHeader>
                <TableHead>ID</TableHead>
                <TableHead>Name (En)</TableHead>
                <TableHead>Name (Ar)</TableHead>
                <TableHead>Actions</TableHead>
                </TableHeader>
                <tbody>
                {paginatedMakes.map(make => (
                    <TableRow key={make.id} onClick={() => handleOpenModal(make)}>
                    <TableCell>
                        <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {make.id}
                        </span>
                    </TableCell>
                    <TableCell><div className="font-medium text-slate-900">{make.name}</div></TableCell>
                    <TableCell>{make.nameAr || '-'}</TableCell>
                    <TableCell>
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" onClick={() => handleOpenModal(make)}><Edit2 size={16} /></Button>
                            <Button variant="ghost" className="text-red-500" onClick={() => { setItemToDelete(make.id); setIsDeleteModalOpen(true); }}><Trash2 size={16} /></Button>
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </tbody>
            </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredMakes.length} />
            </>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Make' : 'Add Make'} footer={
        <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>Save</Button>
        </>
      }>
        <div className="space-y-4">
            <Input label="Make ID" {...register('id')} disabled={!!editingId} placeholder="e.g. TOY" error={errors.id?.message as string} />
            <Input label="Name (En)" {...register('name')} error={errors.name?.message as string} />
            <Input label="Name (Ar)" {...register('nameAr')} dir="rtl" error={errors.nameAr?.message as string} />
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete" footer={
        <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </>
      }>
         <p>Are you sure you want to delete this Make? This action cannot be undone.</p>
      </Modal>

      <Modal isOpen={isBulkOpen} onClose={handleCloseBulk} title="Bulk Import" footer={
         !uploadResult ? (
           <><Button variant="secondary" onClick={handleCloseBulk}>Cancel</Button><Button onClick={handleBulkImport} isLoading={bulkImportMakes.isPending}>Upload</Button></>
         ) : (
           <Button onClick={handleCloseBulk}>Close</Button>
         )
      }>
         {!uploadResult ? (
           <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded">
                   <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">Download Template</span>
                      <span className="text-xs text-slate-500">Get the expected CSV format.</span>
                   </div>
                   <Button variant="secondary" onClick={handleDownloadSample} className="h-8 text-xs gap-2">
                      <Download size={14}/> Download .csv
                   </Button>
               </div>
               
               <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                   <p className="text-sm font-medium text-slate-700 mb-2">Upload File</p>
                   <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
                   <p className="text-xs text-slate-500 mt-2">Accepted file type: .csv</p>
               </div>
           </div>
         ) : (
           <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${uploadResult.recordsSkipped > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                 <div className="flex items-center gap-2 mb-1">
                    {uploadResult.recordsSkipped > 0 ? <AlertTriangle size={18} className="text-amber-600"/> : <CheckCircle2 size={18} className="text-emerald-600"/>}
                    <h3 className="font-bold text-slate-800">Import Processed</h3>
                 </div>
                 <p className="text-sm text-slate-600">{uploadResult.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-slate-50 rounded border border-slate-100 text-center">
                    <span className="block text-2xl font-bold text-emerald-600">{uploadResult.recordsAdded || 0}</span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Added</span>
                 </div>
                 <div className="p-3 bg-slate-50 rounded border border-slate-100 text-center">
                    <span className="block text-2xl font-bold text-amber-500">{uploadResult.recordsSkipped || 0}</span>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Skipped</span>
                 </div>
              </div>

              {uploadResult.skipReasons && uploadResult.skipReasons.length > 0 && (
                <div className="mt-2">
                   <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Skip Details</h4>
                   <div className="max-h-40 overflow-y-auto bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600 space-y-1">
                      {uploadResult.skipReasons.map((reason: string, i: number) => (
                         <div key={i} className="flex gap-2">
                            <span className="text-slate-400">•</span>
                            <span>{reason}</span>
                         </div>
                      ))}
                   </div>
                </div>
              )}
           </div>
         )}
      </Modal>
    </div>
  );
};