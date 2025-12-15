import React, { useState } from 'react';
import { useTypes, useCreateType, useUpdateType, useDeleteType } from '../hooks/useVehicleData';
import { useAppConfig } from '../hooks/useAdminData';
import { VehicleType } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, TextArea } from '../components/UI';
import { Plus, Trash2, Edit2, Loader2, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { generateDescription } from '../services/geminiService';

export const TypesView: React.FC = () => {
  const { data: types = [], isLoading } = useTypes();
  const { data: config } = useAppConfig();
  
  const createType = useCreateType();
  const updateType = useUpdateType();
  const deleteType = useDeleteType();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<VehicleType>();
  const currentName = watch('name');

  const handleOpenModal = (type?: VehicleType) => {
    setEditingId(type?.id || null);
    reset(type || { name: '', description: '' });
    setIsModalOpen(true);
  };

  const onSubmit = (data: VehicleType) => {
    if (editingId) {
      updateType.mutate({ ...data, id: editingId }, { onSuccess: () => { setIsModalOpen(false); toast.success("Updated"); }});
    } else {
      createType.mutate(data, { onSuccess: () => { setIsModalOpen(false); toast.success("Created"); }});
    }
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Delete type?")) deleteType.mutate(id);
  }

  const handleAiGenerate = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (!currentName) {
          toast.error("Please enter a name first.");
          return;
      }
      setIsAiLoading(true);
      const desc = await generateDescription(currentName, "Vehicle Classification Type");
      setValue('description', desc);
      setIsAiLoading(false);
  };

  if (isLoading) return <Loader2 className="animate-spin m-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
         <h1 className="text-2xl font-bold">Vehicle Types</h1>
         <Button onClick={() => handleOpenModal()}><Plus size={18}/> Add Type</Button>
      </div>

      <Card>
         <table className="w-full">
            <TableHeader>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
                {types.map(type => (
                    <TableRow key={type.id} onClick={() => handleOpenModal(type)}>
                        <TableCell><span className="font-mono text-xs text-slate-400">{type.id}</span></TableCell>
                        <TableCell>{type.name}</TableCell>
                        <TableCell>{type.description}</TableCell>
                        <TableCell>
                            <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(type.id); }}><Trash2 size={16} className="text-red-500"/></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </tbody>
         </table>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit' : 'Add'} footer={<Button onClick={handleSubmit(onSubmit)}>Save</Button>}>
          <div className="space-y-4">
              <Input label="Name" {...register('name')} placeholder="e.g. SUV, Sedan" />
              <div className="relative">
                 <TextArea label="Description" {...register('description')} rows={4} />
                 {config?.enableAI && (
                     <button 
                       onClick={handleAiGenerate}
                       disabled={isAiLoading || !currentName}
                       className="absolute top-0 right-0 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                     >
                         {isAiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                         AI Generate
                     </button>
                 )}
              </div>
          </div>
      </Modal>
    </div>
  );
};