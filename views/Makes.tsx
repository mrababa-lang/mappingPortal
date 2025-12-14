import React, { useState } from 'react';
import { useMakes, useModels, useTypes, useCreateMake, useUpdateMake, useDeleteMake, useBulkImportMakes } from '../hooks/useVehicleData';
import { Make } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, TextArea, InfoTooltip } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, FileText, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const makeSchema = z.object({
  name: z.string().min(1, "Make name is required."),
  nameAr: z.string().optional(),
});
type MakeFormData = z.infer<typeof makeSchema>;

export const MakesView: React.FC = () => {
  const { data: makes = [], isLoading } = useMakes();
  const { data: models = [] } = useModels();
  const { data: types = [] } = useTypes();
  
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

  const ITEMS_PER_PAGE = 20;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MakeFormData>({
    resolver: zodResolver(makeSchema),
    defaultValues: { name: '', nameAr: '' }
  });

  const handleOpenModal = (make?: Make) => {
    if (make) {
      setEditingId(make.id);
      reset({ name: make.name, nameAr: make.nameAr || '' });
    } else {
      setEditingId(null);
      reset({ name: '', nameAr: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: MakeFormData) => {
    if (editingId) {
      updateMake.mutate({ id: editingId, ...data } as Make, {
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
            onSuccess: () => {
                setIsBulkOpen(false);
                setBulkFile(null);
                toast.success("Bulk import started successfully.");
            },
            onError: () => toast.error("Failed to upload file.")
        });
    }
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
                  <TableCell><span className="font-mono text-xs text-slate-400">{make.id}</span></TableCell>
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
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Make' : 'Add Make'} footer={
        <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>Save</Button>
        </>
      }>
        <div className="space-y-4">
            <Input label="Name (En)" {...register('name')} />
            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            <Input label="Name (Ar)" {...register('nameAr')} dir="rtl" />
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete" footer={
        <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </>
      }>
         <p>Are you sure you want to delete this Make? This will also delete associated Models.</p>
      </Modal>

      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Import" footer={
         <><Button variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button><Button onClick={handleBulkImport}>Upload</Button></>
      }>
         <div className="p-4 bg-slate-50 border border-slate-200 rounded">
             <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
             <p className="text-xs text-slate-500 mt-2">CSV Format: Name, NameAr</p>
         </div>
      </Modal>
    </div>
  );
};
