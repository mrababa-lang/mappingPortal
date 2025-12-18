
import React, { useState } from 'react';
import { useModels, useMakes, useTypes, useCreateModel, useUpdateModel, useDeleteModel, useBulkImportModels } from '../hooks/useVehicleData';
import { Model } from '../types';
import { Card, Button, Input, Select, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, InfoTooltip, EmptyState, HighlightText } from '../components/UI';
import { Plus, Trash2, Edit2, Upload, Search, Loader2, Download, CheckCircle2, AlertTriangle, Settings2, FileX } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { commonValidators } from '../utils/validation';

const modelSchema = z.object({
  id: commonValidators.numericId,
  makeId: commonValidators.requiredString,
  typeId: commonValidators.requiredString,
  name: commonValidators.requiredString,
  nameAr: commonValidators.arabicText,
});
type ModelFormData = z.infer<typeof modelSchema>;

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
  const [uploadResult, setUploadResult] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema)
  });

  // Helper to extract ID robustly from flat fields, nested objects, or snake_case
  const getSafeId = (item: any, idField: string, nestedObjField?: string) => {
      if (item[idField]) return item[idField];
      if (nestedObjField && item[nestedObjField] && item[nestedObjField].id) return item[nestedObjField].id;
      // Try snake case (e.g., makeId -> make_id)
      const snake = idField.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (item[snake]) return item[snake];
      return '';
  };

  const handleOpenModal = (model?: any) => {
    setEditingId(model?.id || null);
    
    // Robustly find IDs for the form
    const makeId = model ? getSafeId(model, 'makeId', 'make') : '';
    const typeId = model ? getSafeId(model, 'typeId', 'type') : '';
    
    reset({
        id: model?.id || '',
        name: model?.name || '', 
        nameAr: model?.nameAr || '', 
        makeId: String(makeId), 
        typeId: String(typeId) 
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: ModelFormData) => {
    if (editingId) {
      updateModel.mutate({ ...data, id: editingId } as Model, {
        onSuccess: () => { setIsModalOpen(false); toast.success("Model updated"); }
      });
    } else {
      createModel.mutate(data as Model, {
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
          bulkImport.mutate(bulkFile, { 
              onSuccess: (response: any) => { 
                 const resultData = response.data || response;
                 setUploadResult(resultData);
                 setBulkFile(null);
                 toast.success("Import processed"); 
              },
              onError: (err: any) => toast.error(err.message || "Upload failed")
          });
      }
  }

  const handleCloseBulk = () => {
    setIsBulkOpen(false);
    setBulkFile(null);
    setUploadResult(null);
    bulkImport.reset();
  };

  const handleDownloadSample = () => {
    const headers = "id,make,type,name,nameAr";
    const sample = "200,Toyota,1,Land Cruiser,لاند كروزر";
    const csvContent = "\uFEFF" + headers + "\n" + sample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "models_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to display Make Name
  const getMakeName = (model: any) => {
      if (model.make?.name) return model.make.name;
      const id = getSafeId(model, 'makeId', 'make');
      return makes.find(m => m.id == id)?.name || id || '-';
  };

  // Helper to display Type Name
  const getTypeName = (model: any) => {
      if (model.type?.name) return model.type.name;
      if (model.vehicleType?.name) return model.vehicleType.name;
      const id = getSafeId(model, 'typeId', 'type');
      return types.find(t => t.id == id)?.name || id || '-';
  };

  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toString().includes(searchQuery)
  );
  const paginated = filteredModels.slice((currentPage - 1) * 20, currentPage * 20);

  if (isLoading) return <Loader2 className="animate-spin m-auto" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
         <div>
            <h1 className="text-2xl font-bold">Vehicle Models</h1>
            <p className="text-slate-500">Manage vehicle models configuration.</p>
         </div>
         <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsBulkOpen(true)}><Upload size={18}/> Import</Button>
            <Button onClick={() => handleOpenModal()}><Plus size={18}/> Add Model</Button>
         </div>
      </div>
      
      <div className="max-w-md relative">
        <Search className="absolute top-3 left-3 text-slate-400" size={18} />
        <Input label="" placeholder="Search name or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Card>
         {models.length === 0 ? (
             <EmptyState 
               icon={Settings2} 
               title="No Models Found" 
               description="You haven't added any vehicle models yet. Get started by creating one or importing a CSV file."
               action={<Button onClick={() => handleOpenModal()}><Plus size={16}/> Create First Model</Button>}
             />
         ) : filteredModels.length === 0 ? (
             <EmptyState 
               icon={Search} 
               title="No Matches" 
               description={`No models found matching "${searchQuery}".`}
             />
         ) : (
            <>
            <table className="w-full">
                <TableHeader>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actions</TableHead>
                </TableHeader>
                <tbody>
                    {paginated.map(model => (
                        <TableRow key={model.id} onClick={() => handleOpenModal(model)}>
                            <TableCell>
                              <span className="font-mono text-xs text-slate-400">
                                <HighlightText text={model.id.toString()} highlight={searchQuery} />
                              </span>
                            </TableCell>
                            <TableCell>
                                <div><HighlightText text={model.name} highlight={searchQuery} /></div>
                                {model.nameAr && <div className="text-xs text-slate-400" dir="rtl">{model.nameAr}</div>}
                            </TableCell>
                            <TableCell>{getMakeName(model)}</TableCell>
                            <TableCell>{getTypeName(model)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" onClick={(e) => { e.stopPropagation(); handleDelete(model.id); }}><Trash2 size={16} className="text-red-500"/></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </table>
            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredModels.length/20)} onPageChange={setCurrentPage} totalItems={filteredModels.length} />
            </>
         )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Model' : 'Add Model'} footer={<Button onClick={handleSubmit(onSubmit)}>Save</Button>}>
          <div className="space-y-4">
              <Input label="Model ID" {...register('id')} disabled={!!editingId} placeholder="e.g. 200" error={errors.id?.message as string} />
              
              <Select 
                 label="Make" 
                 {...register('makeId')} 
                 options={makes.map(m => ({ value: m.id, label: m.name }))} 
                 error={errors.makeId?.message as string}
              />
              
              <Select 
                 label="Type" 
                 {...register('typeId')} 
                 options={types.map(t => ({ value: t.id, label: t.name }))} 
                 error={errors.typeId?.message as string}
              />
              
              <Input label="Name (En)" {...register('name')} error={errors.name?.message as string} />
              <Input label="Name (Ar)" {...register('nameAr')} dir="rtl" error={errors.nameAr?.message as string} />
          </div>
      </Modal>
      
      <Modal isOpen={isBulkOpen} onClose={handleCloseBulk} title="Bulk Import" footer={
          !uploadResult ? (
            <><Button variant="secondary" onClick={handleCloseBulk}>Cancel</Button><Button onClick={handleBulk} isLoading={bulkImport.isPending}>Upload</Button></>
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
