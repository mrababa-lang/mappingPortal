
import React, { useState, useEffect, useRef } from 'react';
import { useADPMaster, useBulkImportADPMaster, useCreateADPMaster, useUpdateADPMaster } from '../hooks/useADPData';
import { ADPMaster } from '../types';
import { Card, Button, Input, Modal, TableHeader, TableHead, TableRow, TableCell, Pagination, HighlightText, TableSkeleton, EmptyState } from '../components/UI';
import { Upload, Search, Loader2, Download, CheckCircle2, AlertTriangle, Plus, Edit3, X, Database, Clock, Layers, Hash, Car, Settings2, Tags, History, FileEdit, AlertCircle, FileSpreadsheet, ListFilter } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { commonValidators } from '../utils/validation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { HistoryModal } from '../components/HistoryModal';
import * as XLSX from 'xlsx';

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

const HEADER_HEIGHT = 56; // Matching h-14

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
  const [isProcessing, setIsProcessing] = useState(false);

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
    estimateSize: () => 92, 
    overscan: 10
  });

  const handleBulkSync = async () => {
      if(!bulkFile) {
          toast.error("Please select a CSV file first.");
          return;
      }
      
      setIsProcessing(true);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
              
              if (jsonData.length === 0) {
                  toast.error("The selected file is empty.");
                  setIsProcessing(false);
                  return;
              }

              // Send the ENTIRE dataset to the backend as JSON
              bulkImport.mutate(jsonData, { 
                  onSuccess: (result: any) => { 
                      setUploadResult(result);
                      setBulkFile(null);
                      setIsProcessing(false);
                      if (result.recordsAdded === 0 && result.recordsSkipped === 0) {
                          toast.error("Sync complete but 0 records were processed by server.");
                      } else {
                          toast.success(`Successfully synchronized ${result.recordsAdded + result.recordsSkipped} records.`); 
                      }
                  },
                  onError: (err: any) => {
                    setIsProcessing(false);
                    toast.error(err.message || "Bulk synchronization failed");
                  }
              });
          } catch (err) {
              setIsProcessing(false);
              toast.error("Failed to parse CSV file.");
          }
      };
      reader.readAsBinaryString(bulkFile);
  }

  const handleDownloadTemplate = () => {
    const headers = [
        "adpMakeId", "makeEnDesc", "makeArDesc", 
        "adpModelId", "modelEnDesc", "modelArDesc", 
        "adpTypeId", "typeEnDesc", "typeArDesc", 
        "kindCode", "kindEnDesc", "kindArDesc"
    ].join(",");
    const sample = "TOY,Toyota,تويوتا,CAM-2024,Camry SE,كامري,1,Sedan,سيدان,K1,Passenger,ركاب";
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

  const handleCloseBulk = () => {
    setIsBulkOpen(false);
    setUploadResult(null);
    setBulkFile(null);
    setIsProcessing(false);
  };

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
    <div className="space-y-6 flex flex-col h-full overflow-hidden pb-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="space-y-1">
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">ADP Master Hub</h1>
           <p className="text-slate-500 text-sm font-medium">Source vehicle synchronization and technical classification engine.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsBulkOpen(true)} className="h-11 px-6 bg-white shadow-sm border-slate-200">
              <Upload size={18} className="text-slate-500" /> Bulk Sync
            </Button>
            <Button variant="primary" onClick={() => handleOpenEdit()} className="h-11 px-8 bg-slate-900 shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all">
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
            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-slate-100/50 rounded-xl border border-slate-200/40">
                <Database size={14} className="text-indigo-500" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                    {data?.totalElements || 0} Registered Records
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
                <div ref={parentRef} className="flex-1 overflow-auto scroll-smooth relative">
                    <table className="w-full border-collapse table-fixed">
                        <TableHeader className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200">
                            <TableHead className="w-[22%] h-14 text-[10px] font-black uppercase tracking-widest text-slate-500 pl-8">Manufacturer</TableHead>
                            <TableHead className="w-[20%] h-14 text-[10px] font-black uppercase tracking-widest text-slate-500">Model Lineage</TableHead>
                            <TableHead className="w-[20%] h-14 text-[10px] font-black uppercase tracking-widest text-slate-500">Configuration</TableHead>
                            <TableHead className="w-[20%] h-14 text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</TableHead>
                            <TableHead className="w-[18%] h-14 text-right pr-12 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</TableHead>
                        </TableHeader>
                        <tbody 
                            className="relative"
                            style={{ height: `${rowVirtualizer.getTotalSize() + HEADER_HEIGHT}px` }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const item = rows[virtualRow.index];
                                if (!item) return null;
                                return (
                                    <tr
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start + HEADER_HEIGHT}px)`
                                        }}
                                        className="hover:bg-indigo-50/30 transition-all duration-150 flex items-center group border-b border-slate-100/60"
                                        onClick={() => handleOpenEdit(item)}
                                    >
                                        <td className="w-[22%] px-8 py-4 overflow-hidden">
                                            <div className="space-y-1.5">
                                                <div className="font-black text-slate-900 text-sm leading-tight tracking-tight uppercase">
                                                    {item.makeEnDesc ? (
                                                        <HighlightText text={item.makeEnDesc} highlight={debouncedSearch} />
                                                    ) : (
                                                        <span className="text-slate-300 font-mono italic text-[11px]">Code: {item.adpMakeId}</span>
                                                    )}
                                                </div>
                                                <div className="text-[12px] text-slate-400 font-sans font-bold leading-tight truncate" dir="rtl">
                                                    {item.makeArDesc || '---'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/50 uppercase tracking-tighter">
                                                        ID: {item.adpMakeId}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="w-[20%] px-4 py-4 overflow-hidden">
                                            <div className="space-y-1.5">
                                                <div className="font-black text-slate-800 text-sm leading-tight tracking-tight uppercase">
                                                    {item.modelEnDesc ? (
                                                        <HighlightText text={item.modelEnDesc} highlight={debouncedSearch} />
                                                    ) : (
                                                        <span className="text-slate-300 font-mono italic text-[11px]">Code: {item.adpModelId}</span>
                                                    )}
                                                </div>
                                                <div className="text-[12px] text-slate-400 font-sans font-bold leading-tight truncate" dir="rtl">
                                                    {item.modelArDesc || '---'}
                                                </div>
                                                <span className="font-mono text-[9px] font-black text-slate-400/80 uppercase tracking-tighter">
                                                    MOD: {item.adpModelId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="w-[20%] px-4 py-4 overflow-hidden">
                                            <div className="space-y-1.5">
                                                <div className="font-black text-slate-800 text-sm leading-tight tracking-tight uppercase">
                                                    {item.typeEnDesc ? (
                                                        <HighlightText text={item.typeEnDesc} highlight={debouncedSearch} />
                                                    ) : (
                                                        <span className="text-slate-300 font-mono italic text-[11px]">Code: {item.adpTypeId}</span>
                                                    )}
                                                </div>
                                                <div className="text-[12px] text-slate-400 font-sans font-bold leading-tight truncate" dir="rtl">
                                                    {item.typeArDesc || '---'}
                                                </div>
                                                <span className="font-mono text-[9px] font-black text-slate-400/80 uppercase tracking-tighter">
                                                    TYP: {item.adpTypeId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="w-[20%] px-4 py-4 overflow-hidden">
                                            {item.kindEnDesc || item.kindCode ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                        <div className="font-black text-indigo-700 text-[13px] leading-tight uppercase truncate">
                                                            <HighlightText text={item.kindEnDesc || 'Classified'} highlight={debouncedSearch} />
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] text-indigo-400/70 font-sans font-bold leading-tight truncate pl-3.5" dir="rtl">
                                                        {item.kindArDesc || '---'}
                                                    </div>
                                                    <span className="inline-block font-mono text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded ml-3.5 border border-indigo-100/50">
                                                        {item.kindCode || 'NC'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-300 italic text-[11px] font-bold uppercase tracking-wider pl-3.5">
                                                    <AlertTriangle size={12} className="opacity-50" /> Uncategorized
                                                </div>
                                            )}
                                        </td>
                                        <td className="w-[18%] px-8 py-4 text-right pr-12">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    className="h-9 px-3 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-all border border-indigo-100/30 flex items-center gap-2" 
                                                    onClick={(e) => handleOpenHistory(e, item.id)}
                                                >
                                                    <History size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Audit</span>
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm flex items-center gap-2" 
                                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                                                >
                                                    <FileEdit size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Edit</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="bg-slate-50/50 border-t border-slate-100 px-4">
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

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} adpId={selectedAdpId} />

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={editingId ? 'Edit Master Record' : 'Manual Ledger Entry'}
        footer={
            <div className="flex items-center justify-between w-full">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Manual edits are logged for compliance</p>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Discard</Button>
                    <Button onClick={handleSubmit(onFormSubmit)} className="px-10 bg-slate-900 shadow-xl shadow-slate-900/10">Commit Record</Button>
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
                    <input type="hidden" {...register('id')} />
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

      <Modal isOpen={isBulkOpen} onClose={handleCloseBulk} title="Mass Data Synchronizer" footer={
          !uploadResult ? (
             <><Button variant="secondary" onClick={handleCloseBulk}>Cancel</Button><Button onClick={handleBulkSync} isLoading={bulkImport.isPending || isProcessing} className="px-8 shadow-lg shadow-indigo-500/10" disabled={!bulkFile}>Start Bulk Sync</Button></>
          ) : (
             <Button onClick={handleCloseBulk}>Close Wizard</Button>
          )
      }>
         {!uploadResult ? (
             <div className="space-y-5">
                 <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col gap-4">
                    <div className="flex gap-4">
                        <Database size={20} className="shrink-0 text-indigo-500" />
                        <div className="space-y-1">
                            <p className="text-[13px] text-indigo-700 font-bold">Comprehensive JSON Sync</p>
                            <p className="text-[12px] text-indigo-600/80 leading-relaxed">Your CSV will be parsed to JSON locally and transmitted in its entirety to the backend for high-performance mapping.</p>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={handleDownloadTemplate} className="w-full h-9 text-xs border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50">
                        <FileSpreadsheet size={14} /> Download Verified CSV Template
                    </Button>
                 </div>

                 {isProcessing || bulkImport.isPending ? (
                    <div className="p-8 space-y-4 text-center">
                        <div className="flex justify-center">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                        </div>
                        <p className="text-sm font-black text-slate-700 uppercase tracking-widest animate-pulse">
                            {bulkImport.isPending ? 'Synchronizing Entire Dataset...' : 'Parsing File Locally...'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                            Communicating with secure data nodes...
                        </p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        <div className="p-10 bg-slate-50 border-2 border-slate-200 rounded-2xl border-dashed flex flex-col items-center justify-center transition-all hover:bg-slate-100 group cursor-pointer relative">
                            <Upload size={48} className="text-slate-300 mb-4 group-hover:text-indigo-400 group-hover:-translate-y-1 transition-all" />
                            <p className="text-sm font-bold text-slate-700 mb-1">Select your ADP Master CSV</p>
                            <p className="text-xs text-slate-400 mb-6">Drag and drop or click to browse</p>
                            <input type="file" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {bulkFile && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs animate-in zoom-in-95">
                                    <CheckCircle2 size={14} /> {bulkFile.name} detected
                                </div>
                            )}
                        </div>
                    </div>
                 )}
             </div>
         ) : (
             <div className="space-y-6 py-4">
                <div className={`p-5 rounded-2xl flex items-center gap-4 ${uploadResult.recordsAdded === 0 && uploadResult.recordsSkipped === 0 ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                   <div className={`p-3 rounded-xl shadow-inner ${uploadResult.recordsAdded === 0 && uploadResult.recordsSkipped === 0 ? 'bg-rose-100 text-rose-600' : uploadResult.errorCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {uploadResult.recordsAdded === 0 && uploadResult.recordsSkipped === 0 ? <AlertCircle size={24}/> : <CheckCircle2 size={24}/>}
                   </div>
                   <div>
                       <h3 className="font-black text-slate-800 text-lg leading-none mb-1">
                            {uploadResult.recordsAdded === 0 && uploadResult.recordsSkipped === 0 ? 'Zero Records Processed' : 'Mass Synchronization Complete'}
                       </h3>
                       <p className="text-sm text-slate-500 font-medium">
                            {uploadResult.message || 'The server has processed the entire dataset successfully.'}
                       </p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <Card className="p-6 bg-white border-slate-100 text-center shadow-sm">
                      <span className="block text-4xl font-black text-emerald-600 tabular-nums mb-1">{uploadResult.recordsAdded?.toLocaleString() || 0}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Successfully Merged</span>
                   </Card>
                   <Card className="p-6 bg-white border-slate-100 text-center shadow-sm">
                      <span className="block text-4xl font-black text-slate-300 tabular-nums mb-1">{uploadResult.recordsSkipped?.toLocaleString() || 0}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Verified Unchanged</span>
                   </Card>
                </div>

                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Data Integrity Verification Complete</p>
                    {uploadResult.errorCount > 0 && (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded uppercase">{uploadResult.errorCount} Rows Failed Validation</span>
                    )}
                </div>
             </div>
         )}
      </Modal>

      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} adpId={selectedAdpId} />
    </div>
  );
};
