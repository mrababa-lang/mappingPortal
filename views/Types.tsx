import React, { useState } from 'react';
import { useTypes, useCreateType, useUpdateType, useDeleteType } from '../hooks/useVehicleData';
import { useAppConfig } from '../hooks/useAdminData';
import { VehicleType } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, TextArea, EmptyState } from '../components/UI';
import { Plus, Trash2, Edit2, Loader2, Sparkles, Tags } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { generateDescription } from '../services/geminiService';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { commonValidators } from '../utils/validation';

const typeSchema = z.object({
  id: commonValidators.numericId,
  name: commonValidators.requiredString,
  description: z.string().optional(),
});
type TypeFormData = z.infer<typeof typeSchema>;

export const TypesView: React.FC = () => {
  const { data: types = [], isLoading } = useTypes();
  const { data: config } = useAppConfig();
  
  const createType = useCreateType();
  const updateType = useUpdateType();
  const deleteType = useDeleteType();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TypeFormData>({
    resolver: zodResolver(typeSchema)
  });
  const currentName = watch('name');

  const handleOpenModal = (type?: VehicleType) => {
    setEditingId(type?.id || null);
    reset(type || { id: '', name: '', description: '' });
    setIsModalOpen(true);
  };

  const onSubmit = (data: TypeFormData) => {
    if (editingId) {
      updateType.mutate({ ...data, id: editingId } as VehicleType, { onSuccess: () => { setIsModalOpen(false); toast.success("Updated"); }});
    } else {
      createType.mutate(data as VehicleType, { onSuccess: () => { setIsModalOpen(false); toast.success("Created"); }});
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
         <div>
            <h1 className="text-2xl font-bold">Vehicle Types</h1>
            <p className="text-slate-500">Manage vehicle classification types.</p>
         </div>
         <Button onClick={() => handleOpenModal()}><Plus size={18}/> Add Type</Button>
      </div>

      <Card>
         {types.length === 0 ? (
             <EmptyState 
                icon={Tags}
                title="No Types Found"
                description="Define your first vehicle classification type (e.g. SUV, Sedan)."
                action={<Button onClick={() => handleOpenModal()}><Plus size={16}/> Add Type</Button>}
             />
         ) : (
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
         )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit' : 'Add'} footer={<Button onClick={handleSubmit(onSubmit)}>Save</Button>}>
          <div className="space-y-4">
              <Input label="Type ID" {...register('id')} disabled={!!editingId} placeholder="e.g. 1" error={errors.id?.message as string} />
              <Input label="Name" {...register('name')} placeholder="e.g. Sport Utility Vehicle" error={errors.name?.message as string} />
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