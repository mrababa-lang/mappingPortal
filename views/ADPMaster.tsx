
import React, { useState, useEffect, useRef } from 'react';
import { useADPMaster, useBulkImportADPMaster, useCreateADPMaster, useUpdateADPMaster } from '../hooks/useADPData';
import { ADPMaster } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, HighlightText, TableSkeleton, EmptyState } from '../components/UI';
import { Upload, Search, Loader2, Download, CheckCircle2, AlertTriangle, Plus, Edit3, X, Database, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commonValidators } from '../utils/validation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { HistoryModal } from '../components/HistoryModal';

const adpMasterSchema = z.object({
  id: z.string().optional(),
  adpMakeId: commonValidators.requiredString,
  makeEnDesc: commonValidators.requiredString,
  makeArDesc: commonValidators.arabicText,
  adpModelId: commonValidators.requiredString,
  modelEnDesc: commonValidators.requiredString,
  modelArDesc: commonValidators.arabicText,
  adpTypeId: commonValidators.requiredString,
  typeEnDesc: commonValidators.requiredString,
  typeArDesc: commonValidators.arabicText,
});

type ADPMasterFormData = z.infer<typeof adpMasterSchema>;

export const ADPMasterView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAdpId, setSelectedAdpId] = useState<string | null>(null);
  
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading } = useADPMaster({ page, size: 50, q: debouncedSearch });
  const bulkImport = useBulkImportADPMaster();
  const createRecord = useCreateADPMaster();
  const updateRecord = useUpdateADPMaster();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ADPMasterFormData>({
    resolver: zodResolver(adpMasterSchema)
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = data?.content || [];

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10
  });

  const handleBulk = () => {
      if(bulkFile) {
          bulkImport.mutate(bulkFile, { 
              onSuccess: (response: any) => { 
                  const resultData = response.data || response;
                  setUploadResult(resultData);
                  setBulkFile(null);
                  toast.success("Bulk update processed (Upsert logic applied)"); 
              },
              onError: (err: any) => toast.error(err.message || "Upload failed")
          });
      }
  }

  const handleOpenEdit = (record?: ADPMaster) => {
    if (record) {
      setEditingId(record.id);
      reset(record);
    } else {
      setEditingId(null);
      reset({
        adpMakeId: '', makeEnDesc: '', makeArDesc: '',
        adpModelId: '', modelEnDesc: '', modelArDesc: '',
        adpTypeId: '', typeEnDesc: '', typeArDesc: ''
      });
    }
    setIsEditModalOpen(true);
  };

  const onFormSubmit = (formData: ADPMasterFormData) => {
    if (editingId) {
      updateRecord.mutate({ ...formData, id: editingId } as ADPMaster, {
        onSuccess: () => {
          setIsEditModalOpen(false);
          toast.success("ADP record updated successfully");
        }
      });
    } else {
      createRecord.mutate(formData as ADPMaster, {
        onSuccess: () => {
          setIsEditModalOpen(false);
          toast.success("Manual ADP record created");
        }
      });
    }
  };

  const handleOpenHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedAdpId(id);
    setIsHistoryOpen(true);
  };

  const handleDownloadSample = () => {
    const headers = "adpMakeId,makeEnDesc,makeArDesc,adpModelId,modelEnDesc,modelArDesc,adpTypeId,typeEnDesc,typeArDesc";
    const sample = "TOY-01,Toyota,تويوتا,LC-200,Land Cruiser,لاند كروزر,SUV,SUV,دفع رباعي";
    const csvContent = "\uFEFF" + headers + "\n" + sample;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "adp_master_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Master List</h1>
           <p className="text-slate-500">Source data integration with upsert capability and history audit.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsBulkOpen(true)}><Upload size={18} /> Bulk Update</Button>
            <Button variant="primary" onClick={() => handleOpenEdit()}><Plus size={18} /> Add Record</Button>
        </div>
      </div>

      <Card className="p-4 bg-white border border-slate-200 shrink-0">
        <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute top-3 left-3 text-slate-400" size={18} />
                <Input 
                    label="" 
                    placeholder="Search Make, Model, or ID..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="pl-10 h-11"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                )}
            </div>
            <div className="hidden sm:block text-xs font-medium text-slate-400">
                {data?.totalElements || 0} Records Total
            </div>
        </div>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col min-h-0 border border-slate-200">
        {isLoading ? <TableSkeleton rows={12} cols={4} /> : (
        <>
            {rows.length === 0 ? (
                <EmptyState 
                    title="No Master Records"
                    description="Upload your first ADP Master CSV or add a record manually."
                    icon={Database}
                    action={<Button onClick={() => handleOpenEdit()}><Plus size={16} /> Add Record</Button>}
                />
            ) : (
                <div ref={parentRef} className="flex-1 overflow-auto">
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        <table className="w-full">
                            <TableHeader>
                                <TableHead className="w-1/4">Manufacturer (ADP)</TableHead>
                                <TableHead className="w-1/4">Model Description</TableHead>
                                <TableHead className="w-1/4">Vehicle Type</TableHead>
                                <TableHead className="w-1/4 text-right">Actions</TableHead>
                            </TableHeader>
                            <tbody>
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const item = rows[virtualRow.index];
                                    return (
                                        <tr
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`
                                            }}
                                            className="border-b border-slate-100 hover:bg-slate-50 flex items-center px-4"
                                            onClick={() => handleOpenEdit(item)}
                                        >
                                            <td className="w-1/4 px-6 py-2">
                                                <div className="space-y-0.5 truncate">
                                                    <div className="font-bold text-slate-900 text-sm">
                                                        <HighlightText text={item.makeEnDesc} highlight={debouncedSearch} />
                                                    </div>
                                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none">
                                                        <HighlightText text={item.adpMakeId} highlight={debouncedSearch} />
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="w-1/4 px-6 py-2">
                                                <div className="space-y-0.5 truncate">
                                                    <div className="font-medium text-slate-700 text-sm">
                                                        <HighlightText text={item.modelEnDesc} highlight={debouncedSearch} />
                                                    </div>
                                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none">
                                                        <HighlightText text={item.adpModelId} highlight={debouncedSearch} />
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="w-1/4 px-6 py-2">
                                                <div className="space-y-0.5 truncate">
                                                    <div className="font-medium text-slate-700 text-sm">
                                                        <HighlightText text={item.typeEnDesc} highlight={debouncedSearch} />
                                                    </div>
                                                    <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none">
                                                        {item.adpTypeId}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="w-1/4 px-6 py-2 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-indigo-50" onClick={(e) => handleOpenHistory(e, item.id)}>
                                                        <Clock size={14} className="text-slate-400" />
                                                    </Button>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}>
                                                        <Edit3 size={14} className="text-slate-400" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <Pagination 
                currentPage={page} 
                totalPages={data?.totalPages || 1} 
                onPageChange={setPage} 
                totalItems={data?.totalElements || 0} 
            />
        </>
        )}
      </Card>

      {/* Manual Entry/Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={editingId ? 'Edit ADP Master Record' : 'Add Manual ADP Record'}
        footer={<Button onClick={handleSubmit(onFormSubmit)} className="px-12">Save Record</Button>}
      >
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Manufacturer Info</h3>
                    <Input label="ADP Make ID" {...register('adpMakeId')} error={errors.adpMakeId?.message as string} placeholder="e.g. TOY" />
                    <Input label="Make Desc (EN)" {...register('makeEnDesc')} error={errors.makeEnDesc?.message as string} />
                    <Input label="Make Desc (AR)" {...register('makeArDesc')} error={errors.makeArDesc?.message as string} dir="rtl" />
                </div>
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Model Info</h3>
                    <Input label="ADP Model ID" {...register('adpModelId')} error={errors.adpModelId?.message as string} placeholder="e.g. LC-200" />
                    <Input label="Model Desc (EN)" {...register('modelEnDesc')} error={errors.modelEnDesc?.message as string} />
                    <Input label="Model Desc (AR)" {...register('modelArDesc')} error={errors.modelArDesc?.message as string} dir="rtl" />
                </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-1">Classification Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="ADP Type ID" {...register('adpTypeId')} error={errors.adpTypeId?.message as string} />
                    <Input label="Type Desc (EN)" {...register('typeEnDesc')} error={errors.typeEnDesc?.message as string} />
                    <Input label="Type Desc (AR)" {...register('typeArDesc')} error={errors.typeArDesc?.message as string} dir="rtl" />
                </div>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Master Upload (Upsert Logic)" footer={
          !uploadResult ? (
             <><Button variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button><Button onClick={handleBulk} isLoading={bulkImport.isPending}>Upload & Sync</Button></>
          ) : (
             <Button onClick={() => setIsBulkOpen(false)}>Close</Button>
          )
      }>
         {!uploadResult ? (
             <div className="space-y-4">
                 <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 flex gap-2">
                    <Database size={16} className="shrink-0" />
                    <p><strong>Upsert Logic:</strong> Uploading records with existing IDs will update the descriptions. New IDs will be added as fresh master records.</p>
                 </div>

                 <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded">
                     <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">Download Template</span>
                        <span className="text-xs text-slate-500">Get the expected CSV format for bulk upsert.</span>
                     </div>
                     <Button variant="secondary" onClick={handleDownloadSample} className="h-8 text-xs gap-2">
                        <Download size={14}/> Download Template
                     </Button>
                 </div>
                 
                 <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl border-dashed flex flex-col items-center">
                     <Upload size={32} className="text-slate-300 mb-2" />
                     <p className="text-sm font-medium text-slate-700 mb-4 text-center">Select or drag ADP CSV here</p>
                     <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="text-xs" />
                 </div>
             </div>
         ) : (
             <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                   <CheckCircle2 size={18} className="text-emerald-600"/>
                   <div>
                       <h3 className="font-bold text-slate-800">Sync Complete</h3>
                       <p className="text-sm text-slate-600">The ADP master data has been synchronized.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="block text-2xl font-bold text-emerald-600">{uploadResult.recordsAdded || uploadResult.addedCount || 0}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Added/Updated</span>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <span className="block text-2xl font-bold text-amber-500">{uploadResult.recordsSkipped || uploadResult.skippedCount || 0}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Skipped</span>
                   </div>
                </div>
             </div>
         )}
      </Modal>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} adpId={selectedAdpId} />
    </div>
  );
};
