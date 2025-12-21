
import React, { useState, useEffect, useRef } from 'react';
import { useADPMaster, useBulkImportADPMaster, useCreateADPMaster, useUpdateADPMaster } from '../hooks/useADPData';
import { ADPMaster } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, HighlightText, TableSkeleton, EmptyState } from '../components/UI';
// Added missing icon imports (Car, Settings2, Tags) to resolve errors on lines 341, 349, and 360
import { Upload, Search, Loader2, Download, CheckCircle2, AlertTriangle, Plus, Edit3, X, Database, Clock, Layers, Hash, Car, Settings2, Tags } from 'lucide-react';
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
  kindCode: z.string().optional().or(z.literal('')),
  kindEnDesc: z.string().optional().or(z.literal('')),
  kindArDesc: commonValidators.arabicText,
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
    estimateSize: () => 82, // Optimized height for stacked bilingual text
    overscan: 12
  });

  const handleBulk = () => {
      if(bulkFile) {
          bulkImport.mutate(bulkFile, { 
              onSuccess: (response: any) => { 
                  const resultData = response.data || response;
                  setUploadResult(resultData);
                  setBulkFile(null);
                  toast.success("Bulk update processed successfully"); 
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
        adpTypeId: '', typeEnDesc: '', typeArDesc: '',
        kindCode: '', kindEnDesc: '', kindArDesc: ''
      });
    }
    setIsEditModalOpen(true);
  };

  const onFormSubmit = (formData: ADPMasterFormData) => {
    if (editingId) {
      updateRecord.mutate({ ...formData, id: editingId } as ADPMaster, {
        onSuccess: () => {
          setIsEditModalOpen(false);
          toast.success("Record updated");
        }
      });
    } else {
      createRecord.mutate(formData as ADPMaster, {
        onSuccess: () => {
          setIsEditModalOpen(false);
          toast.success("Record created");
        }
      });
    }
  };

  const handleOpenHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedAdpId(id);
    setIsHistoryOpen(true);
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="space-y-1">
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">ADP Master Hub</h1>
           <p className="text-slate-500 text-sm font-medium">Source vehicle synchronization and technical classification engine.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsBulkOpen(true)} className="h-11 px-6 bg-white shadow-sm border-slate-200">
              <Upload size={18} className="text-slate-500" /> Bulk Update
            </Button>
            <Button variant="primary" onClick={() => handleOpenEdit()} className="h-11 px-8 bg-slate-900 shadow-lg shadow-slate-900/10">
              <Plus size={18} /> Add Record
            </Button>
        </div>
      </div>

      <Card className="p-4 bg-white border border-slate-200/60 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
            <div className="relative flex-1 max-w-2xl">
                <Search className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400" size={20} />
                <Input 
                    label="" 
                    placeholder="Search by Make, Model, Type or Kind classification..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="pl-12 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-slate-900/5 focus:border-slate-400 transition-all text-base"
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                )}
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100/50 rounded-lg border border-slate-200/40">
                <Database size={14} className="text-slate-400" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                    {data?.totalElements || 0} Synchronized Records
                </span>
            </div>
        </div>
      </Card>

      <Card className="flex-1 overflow-hidden flex flex-col min-h-0 border border-slate-200/80 shadow-sm rounded-2xl bg-white">
        {isLoading ? <TableSkeleton rows={12} cols={5} /> : (
        <>
            {rows.length === 0 ? (
                <EmptyState 
                    title="Source Ledger is Empty"
                    description="No ADP Master records were found. Sync your ERP data via Bulk Update or add manually."
                    icon={Database}
                    action={<Button onClick={() => handleOpenEdit()} variant="primary" className="mt-4">Add Manual Entry</Button>}
                />
            ) : (
                <div ref={parentRef} className="flex-1 overflow-auto scroll-smooth">
                    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        <table className="w-full border-collapse">
                            <TableHeader className="bg-slate-50/80 backdrop-blur-md sticky top-0 z-20">
                                <TableHead className="w-[20%] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Manufacturer</TableHead>
                                <TableHead className="w-[20%] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Model Lineage</TableHead>
                                <TableHead className="w-[20%] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Configuration</TableHead>
                                <TableHead className="w-[20%] h-12 text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</TableHead>
                                <TableHead className="w-[20%] h-12 text-right pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</TableHead>
                            </TableHeader>
                            <tbody className="divide-y divide-slate-100">
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
                                            className="hover:bg-slate-50/50 transition-all duration-200 flex items-center px-4 group border-b border-slate-100/50"
                                            onClick={() => handleOpenEdit(item)}
                                        >
                                            {/* Manufacturer Column */}
                                            <td className="w-[20%] px-6 py-3">
                                                <div className="space-y-1.5 truncate">
                                                    <div className="font-bold text-slate-900 text-[14px] leading-none tracking-tight">
                                                        <HighlightText text={item.makeEnDesc} highlight={debouncedSearch} />
                                                    </div>
                                                    <div className="text-[12px] text-slate-400 font-sans font-medium opacity-80" dir="rtl">
                                                        {item.makeArDesc}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Hash size={10} className="text-slate-400" />
                                                        <span className="font-mono text-[9px] font-black uppercase tracking-tighter text-slate-500">
                                                            {item.adpMakeId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Model Column */}
                                            <td className="w-[20%] px-6 py-3">
                                                <div className="space-y-1.5 truncate">
                                                    <div className="font-bold text-slate-800 text-[14px] leading-none tracking-tight">
                                                        <HighlightText text={item.modelEnDesc} highlight={debouncedSearch} />
                                                    </div>
                                                    <div className="text-[12px] text-slate-400 font-sans font-medium opacity-80" dir="rtl">
                                                        {item.modelArDesc}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Hash size={10} className="text-slate-400" />
                                                        <span className="font-mono text-[9px] font-black uppercase tracking-tighter text-slate-500">
                                                            {item.adpModelId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Type Column */}
                                            <td className="w-[20%] px-6 py-3">
                                                <div className="space-y-1.5 truncate">
                                                    <div className="font-bold text-slate-800 text-[14px] leading-none tracking-tight">
                                                        <HighlightText text={item.typeEnDesc} highlight={debouncedSearch} />
                                                    </div>
                                                    <div className="text-[12px] text-slate-400 font-sans font-medium opacity-80" dir="rtl">
                                                        {item.typeArDesc}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Hash size={10} className="text-slate-400" />
                                                        <span className="font-mono text-[9px] font-black uppercase tracking-tighter text-slate-500">
                                                            {item.adpTypeId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Kind Column */}
                                            <td className="w-[20%] px-6 py-3">
                                                {item.kindCode || item.kindEnDesc ? (
                                                    <div className="space-y-1.5 truncate">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                                            <div className="font-bold text-indigo-700 text-[13px] leading-none">
                                                                <HighlightText text={item.kindEnDesc || 'Classified'} highlight={debouncedSearch} />
                                                            </div>
                                                        </div>
                                                        <div className="text-[11px] text-indigo-400 font-sans font-bold opacity-80 pl-3.5" dir="rtl">
                                                            {item.kindArDesc}
                                                        </div>
                                                        <span className="inline-block font-mono text-[9px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded ml-3.5 border border-indigo-100/50">
                                                            {item.kindCode || '---'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-300 italic text-xs font-medium">
                                                        <AlertTriangle size={12} /> Uncategorized
                                                    </div>
                                                )}
                                            </td>
                                            <td className="w-[20%] px-6 py-3 text-right pr-8">
                                                <div className="flex justify-end gap-1.5">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-9 w-9 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100" 
                                                        onClick={(e) => handleOpenHistory(e, item.id)}
                                                        title="Audit Trail"
                                                    >
                                                        <Clock size={16} />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200" 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                                                        title="Modify Record"
                                                    >
                                                        <Edit3 size={16} />
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
            <div className="bg-slate-50/50 border-t border-slate-100">
                <Pagination 
                    currentPage={page} 
                    totalPages={data?.totalPages || 1} 
                    onPageChange={setPage} 
                    totalItems={data?.totalElements || 0} 
                />
            </div>
        </>
        )}
      </Card>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={editingId ? 'Edit Master Record' : 'Manual Ledger Entry'}
        footer={
            <div className="flex items-center justify-between w-full">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Manual edits are logged for compliance</p>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Discard</Button>
                    <Button onClick={handleSubmit(onFormSubmit)} className="px-10 bg-slate-900 shadow-md">Commit Record</Button>
                </div>
            </div>
        }
      >
        <div className="space-y-8 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                <div className="space-y-5">
                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Car className="w-3.5 h-3.5" /> Manufacturer Detail
                    </h3>
                    <Input label="Source ID" {...register('adpMakeId')} error={errors.adpMakeId?.message as string} placeholder="e.g. TOY" className="font-mono text-xs" />
                    <Input label="Description (English)" {...register('makeEnDesc')} error={errors.makeEnDesc?.message as string} />
                    <Input label="Description (Arabic)" {...register('makeArDesc')} error={errors.makeArDesc?.message as string} dir="rtl" className="font-sans" />
                </div>
                <div className="space-y-5">
                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Settings2 className="w-3.5 h-3.5" /> Model Lineage
                    </h3>
                    <Input label="Source ID" {...register('adpModelId')} error={errors.adpModelId?.message as string} placeholder="e.g. LC-200" className="font-mono text-xs" />
                    <Input label="Description (English)" {...register('modelEnDesc')} error={errors.modelEnDesc?.message as string} />
                    <Input label="Description (Arabic)" {...register('modelArDesc')} error={errors.modelArDesc?.message as string} dir="rtl" className="font-sans" />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 pt-4">
                <div className="space-y-5">
                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Tags className="w-3.5 h-3.5" /> Configuration Type
                    </h3>
                    <Input label="Source ID" {...register('adpTypeId')} error={errors.adpTypeId?.message as string} className="font-mono text-xs" />
                    <Input label="Description (English)" {...register('typeEnDesc')} error={errors.typeEnDesc?.message as string} />
                    <Input label="Description (Arabic)" {...register('typeArDesc')} error={errors.typeArDesc?.message as string} dir="rtl" className="font-sans" />
                </div>
                <div className="space-y-5">
                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 border-b border-indigo-100 pb-2">
                        <Layers className="w-3.5 h-3.5" /> Kind / Classification
                    </h3>
                    <Input label="Kind Code" {...register('kindCode')} error={errors.kindCode?.message as string} placeholder="e.g. K-01" className="font-mono text-xs" />
                    <Input label="Description (English)" {...register('kindEnDesc')} error={errors.kindEnDesc?.message as string} />
                    <Input label="Description (Arabic)" {...register('kindArDesc')} error={errors.kindArDesc?.message as string} dir="rtl" className="font-sans" />
                </div>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Master Bulk Synchronizer" footer={
          !uploadResult ? (
             <><Button variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button><Button onClick={handleBulk} isLoading={bulkImport.isPending} className="px-8 shadow-lg shadow-indigo-500/10">Upload & Synchronize</Button></>
          ) : (
             <Button onClick={() => setIsBulkOpen(false)}>Close Wizard</Button>
          )
      }>
         {!uploadResult ? (
             <div className="space-y-5">
                 <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-[13px] text-indigo-700 flex gap-4 leading-relaxed">
                    <Database size={20} className="shrink-0 text-indigo-500" />
                    <p><strong>Intelligent Upsert Logic:</strong> The system will identify existing records by their source IDs and update descriptions automatically. New unique identifiers will be appended as fresh ledger entries.</p>
                 </div>

                 <div className="p-10 bg-slate-50 border-2 border-slate-200 rounded-2xl border-dashed flex flex-col items-center justify-center transition-all hover:bg-slate-100 group cursor-pointer relative">
                     <Upload size={48} className="text-slate-300 mb-4 group-hover:text-indigo-400 group-hover:-translate-y-1 transition-all" />
                     <p className="text-sm font-bold text-slate-700 mb-1">Drop your ADP Master CSV here</p>
                     <p className="text-xs text-slate-400 mb-6">UTF-8 encoded files supported (Max 50MB)</p>
                     <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                     {bulkFile && (
                         <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs animate-in zoom-in-95">
                             <CheckCircle2 size={14} /> {bulkFile.name}
                         </div>
                     )}
                 </div>
             </div>
         ) : (
             <div className="space-y-6 py-4">
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
                   <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner">
                        <CheckCircle2 size={24}/>
                   </div>
                   <div>
                       <h3 className="font-black text-slate-800 text-lg leading-none mb-1">Synchronization Complete</h3>
                       <p className="text-sm text-slate-500 font-medium">The ERP source ledger has been updated across all environments.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <Card className="p-6 bg-white border-slate-100 text-center shadow-sm">
                      <span className="block text-4xl font-black text-emerald-600 tabular-nums mb-1">{uploadResult.recordsAdded || uploadResult.addedCount || 0}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Modified / New</span>
                   </Card>
                   <Card className="p-6 bg-white border-slate-100 text-center shadow-sm">
                      <span className="block text-4xl font-black text-slate-300 tabular-nums mb-1">{uploadResult.recordsSkipped || uploadResult.skippedCount || 0}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Valid Unchanged</span>
                   </Card>
                </div>
             </div>
         )}
      </Modal>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} adpId={selectedAdpId} />
    </div>
  );
};
