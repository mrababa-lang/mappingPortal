import React, { useState } from 'react';
import { useADPMaster, useBulkImportADPMaster } from '../hooks/useADPData';
import { ADPMaster } from '../types';
import { Card, Button, Input, Modal, InfoTooltip } from '../components/UI';
import { Upload, Search, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export const ADPMasterView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const { data, isLoading } = useADPMaster({ page, size: 20, q: search });
  const bulkImport = useBulkImportADPMaster();

  const handleBulk = () => {
      if(bulkFile) {
          bulkImport.mutate(bulkFile, { onSuccess: () => { setIsBulkOpen(false); toast.success("Upload started"); } });
      }
  }

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Master List</h1>
           <p className="text-slate-500">View source data from ADP.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsBulkOpen(true)}><Upload size={18} /> Bulk Upload</Button>
      </div>

      <div className="max-w-sm">
        <Input label="" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div> : (
        <>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <tr>
                        <th className="px-6 py-3 text-left">Make</th>
                        <th className="px-6 py-3 text-left">Model</th>
                        <th className="px-6 py-3 text-left">Type</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {(data?.content || []).map((item: ADPMaster) => (
                        <tr key={item.id}>
                            <td className="px-6 py-3">
                                <div className="text-sm font-medium">{item.makeEnDesc}</div>
                                <div className="text-xs text-slate-500">{item.adpMakeId}</div>
                            </td>
                            <td className="px-6 py-3">
                                <div className="text-sm font-medium">{item.modelEnDesc}</div>
                                <div className="text-xs text-slate-500">{item.adpModelId}</div>
                            </td>
                            <td className="px-6 py-3">
                                <div className="text-sm font-medium">{item.typeEnDesc}</div>
                                <div className="text-xs text-slate-500">{item.adpTypeId}</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
            {/* Simple Pagination Controls */}
            <div className="p-4 border-t flex justify-between items-center">
                <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <span className="text-sm text-slate-500">Page {page} of {data?.totalPages}</span>
                <Button variant="secondary" disabled={page >= (data?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
        </>
        )}
      </Card>

      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk Import" footer={<Button onClick={handleBulk}>Upload</Button>}>
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
      </Modal>
    </div>
  );
};