import React, { useState } from 'react';
import { useModels, useMakes, useTypes, useCreateModel, useUpdateModel, useDeleteModel, useBulkImportModels } from '../hooks/useVehicleData';
import { Model } from '../types';
import { Card, Button, Input, Select, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, InfoTooltip } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, Search, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export const ModelsView: React.FC = () => {
  const { data: models = [], isLoading } = useModels();
  const { data: makes = [] } = useMakes();
  const { data: types = [] } = useTypes();
  
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();
  const bulkImport = useBulkImportModels();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const { register, handleSubmit, reset } = useForm<Model>();

  const handleOpenModal = (model?: Model) => {
    setEditingId(model?.id || null);
    reset(model || { name: '', nameAr: '', makeId: '', typeId: '' });
    setIsModalOpen(true);
  };

  const onSubmit = (data: Model) => {
    if (editingId) {
      updateModel.mutate({ ...data, id: editingId }, {
        onSuccess: () => { setIsModalOpen(false); toast.success("Model updated"); }
      });
    } else {
      createModel.mutate(data, {
        onSuccess: () => { setIsModalOpen(false); toast.success("Model created"); }
      });
    }
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Delete this model?")) {
        deleteModel.mutate(id, { onSuccess: () => toast.success("Model deleted") });
    }
  };
  
  const handleBulk = () => {
      if(bulkFile) {
          bulkImport.mutate(bulkFile, { onSuccess: () => { setIsBulkOpen(false); toast.success("Importing..."); } });
      }
  }

  const filteredModels = models.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const paginated = filteredModels.slice((currentPage - 1) * 20, currentPage * 20);

  if (isLoading) return <Loader2 className="animate-spin m-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
         <h1 className="text-2xl font-bold">Vehicle Models</h1>
         <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsBulkOpen(true)}><Upload size={18}/> Import</Button>
            <Button onClick={() => handleOpenModal()}><Plus size={18}/> Add Model</Button>
         </div>
      </div>
      
      <Input label="" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

      <Card>
         <table className="w-full">
            <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
                {paginated.map(model => (
                    <TableRow key={model.id} onClick={() => handleOpenModal(model)}>
                        <TableCell>{model.name}</TableCell>
                        <TableCell>{makes.find(m => m.id === model.makeId)?.name || model.makeId}</TableCell>
                        <TableCell>{types.find(t => t.id === model.typeId)?.name || model.typeId}</TableCell>
                        <TableCell>
                            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }}><Trash2 size={16} className="text-red-500"/></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </tbody>
         </table>
         <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredModels.length/20)} onPageChange={setCurrentPage} totalItems={filteredModels.length} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit' : 'Add'} footer={<Button onClick={handleSubmit(onSubmit)}>Save</Button>}>
          <div className="space-y-4">
              <Select label="Make" {...register('makeId')} options={makes.map(m => ({ value: m.id, label: m.name }))} />
              <Select label="Type" {...register('typeId')} options={types.map(t => ({ value: t.id, label: t.name }))} />
              <Input label="Name (En)" {...register('name')} />
              <Input label="Name (Ar)" {...register('nameAr')} />
          </div>
      </Modal>
      
      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Import" footer={<Button onClick={handleBulk}>Upload</Button>}>
          <input type="file" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
      </Modal>
    </div>
  );
};
