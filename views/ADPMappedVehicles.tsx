import React, { useState } from 'react';
import { useADPMappedVehicles, downloadMappedVehiclesReport } from '../hooks/useADPData';
import { Card, Button, Input, Pagination, TableHeader, TableHead, TableRow, TableCell } from '../components/UI';
import { Download, Loader2, Search, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const ADPMappedVehiclesView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, refetch } = useADPMappedVehicles({ 
      page, 
      size: 20, 
      q: searchQuery, 
      dateFrom, 
      dateTo 
  });

  const handleExport = async () => {
      setIsExporting(true);
      try {
          await downloadMappedVehiclesReport(dateFrom, dateTo);
          toast.success("Report downloaded successfully");
      } catch (e) {
          toast.error("Failed to download report");
      } finally {
          setIsExporting(false);
      }
  };

  const renderStatus = (status: string) => {
    switch(status) {
        case 'MAPPED': return <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Mapped</span>;
        case 'MISSING_MODEL': return <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={14}/> Missing Model</span>;
        default: return <span className="text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Mapped Vehicles</h1>
           <p className="text-slate-500">View and export all successfully mapped ADP records.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} isLoading={isExporting}>
                <Download size={18} /> Export CSV
            </Button>
        </div>
      </div>

      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
           <div className="relative flex-1">
             <Search className="absolute top-3 left-3 text-slate-400" size={18} />
             <Input 
               label="" 
               placeholder="Search Make/Model..." 
               value={searchQuery}
               onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
               className="pl-10"
             />
           </div>
           <div className="flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              <Input 
                 type="date" 
                 label="" 
                 value={dateFrom} 
                 onChange={e => { setDateFrom(e.target.value); setPage(1); }} 
                 className="w-36"
              />
              <span className="text-slate-400">-</span>
              <Input 
                 type="date" 
                 label="" 
                 value={dateTo} 
                 onChange={e => { setDateTo(e.target.value); setPage(1); }} 
                 className="w-36"
              />
           </div>
           {(dateFrom || dateTo || searchQuery) && (
             <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); }} className="text-red-500">
                 Clear
             </Button>
           )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div> : (
        <>
            <div className="overflow-x-auto">
            <table className="w-full">
                <TableHeader>
                    <TableHead>ADP Source</TableHead>
                    <TableHead>SlashData Mapping</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mapped Date</TableHead>
                </TableHeader>
                <tbody>
                    {(data?.content || []).length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-slate-500">No mapped vehicles found.</td></tr>
                    ) : (data?.content || []).map((row: any) => (
                        <TableRow key={row.adpId || row.id}>
                            <TableCell>
                                <div className="font-medium text-slate-900">{row.makeEnDesc} {row.modelEnDesc}</div>
                                <span className="text-xs text-slate-400 font-mono">{row.adpMakeId} / {row.adpModelId}</span>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium text-indigo-700">{row.sdMakeName}</div>
                                <div className="text-sm text-slate-600">{row.sdModelName || '-'}</div>
                            </TableCell>
                            <TableCell>
                                {renderStatus(row.status)}
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-slate-600">
                                    {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </tbody>
            </table>
            </div>
            <Pagination currentPage={page} totalPages={data?.totalPages || 1} onPageChange={setPage} totalItems={data?.totalElements || 0} />
        </>
        )}
      </Card>
    </div>
  );
};
