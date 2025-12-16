import React, { useState } from 'react';
import { useADPMappings, useApproveMapping, useRejectMapping, useBulkMappingAction } from '../hooks/useADPData';
import { Card, Button, TableHeader, TableHead, TableRow, TableCell, Select, Input, Pagination, Modal } from '../components/UI';
import { CheckCircle2, Clock, ArrowRight, AlertTriangle, HelpCircle, Filter, X, Ban, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const MappingReviewView: React.FC = () => {
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'MAPPED' | 'MISSING_MAKE' | 'MISSING_MODEL'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useADPMappings({
      page,
      size: 20,
      reviewStatus: statusFilter,
      mappingType: typeFilter,
      dateFrom,
      dateTo
  });

  const approveMutation = useApproveMapping();
  const rejectMutation = useRejectMapping();
  const bulkMutation = useBulkMappingAction();

  const [confirmAction, setConfirmAction] = useState<{ type: 'approveAll' | 'rejectAll', count: number, ids: string[] } | null>(null);

  const handleApprove = (id: string) => {
      approveMutation.mutate(id, {
          onSuccess: () => {
              toast.success("Mapping approved");
              refetch();
          }
      });
  };

  const handleReject = (id: string) => {
      if(window.confirm("Are you sure you want to reject this mapping? It will be reset to Unmapped.")) {
          rejectMutation.mutate(id, {
            onSuccess: () => {
                toast.success("Mapping rejected/reset");
                refetch();
            }
          });
      }
  };

  const handleBulkApprove = () => {
     if (!data?.content || data.content.length === 0) return;
     // Filter only pending items for bulk approval
     const pendingIds = data.content.filter((i: any) => !i.reviewedAt).map((i: any) => i.adpId);
     if (pendingIds.length === 0) {
         toast.info("No pending items to approve on this page.");
         return;
     }
     setConfirmAction({ type: 'approveAll', count: pendingIds.length, ids: pendingIds });
  };

  const confirmBulkAction = () => {
      if (!confirmAction) return;
      
      const action = confirmAction.type === 'approveAll' ? 'APPROVE' : 'REJECT';
      bulkMutation.mutate({
          action,
          ids: confirmAction.ids
      }, {
          onSuccess: () => {
              toast.success(`Bulk ${action} successful`);
              setConfirmAction(null);
              refetch();
          }
      });
  };

  const renderStatus = (status: string) => {
      switch(status) {
          case 'MAPPED': return <span className="text-emerald-600 flex items-center gap-1 font-medium"><CheckCircle2 size={14}/> Mapped</span>;
          case 'MISSING_MAKE': return <span className="text-red-600 flex items-center gap-1 font-medium"><AlertTriangle size={14}/> Missing Make</span>;
          case 'MISSING_MODEL': return <span className="text-amber-600 flex items-center gap-1 font-medium"><HelpCircle size={14}/> Missing Model</span>;
          default: return <span className="text-slate-400 flex items-center gap-1"><Ban size={14}/> Unmapped</span>;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
            <p className="text-slate-500">Validate and approve mapping links created by users.</p>
         </div>
         <div className="flex gap-2">
            {statusFilter === 'pending' && (
                <Button onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 size={18}/> Approve Page
                </Button>
            )}
         </div>
      </div>

      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium min-w-fit">
                <Filter size={18} />
                <span>Filters:</span>
            </div>
            <div className="w-full md:w-48">
                <Select 
                    label="Review Status" 
                    value={statusFilter} 
                    onChange={v => setStatusFilter(v as any)} 
                    options={[{value: 'pending', label: 'Pending Review'}, {value: 'reviewed', label: 'Already Reviewed'}, {value: 'all', label: 'All Records'}]}
                />
            </div>
            <div className="w-full md:w-48">
                <Select 
                    label="Mapping Type" 
                    value={typeFilter} 
                    onChange={v => setTypeFilter(v as any)} 
                    options={[{value: 'all', label: 'All Types'}, {value: 'MAPPED', label: 'Mapped'}, {value: 'MISSING_MODEL', label: 'Missing Model'}, {value: 'MISSING_MAKE', label: 'Missing Make'}]}
                />
            </div>
            <div className="w-full md:w-40">
                 <Input type="date" label="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="w-full md:w-40">
                 <Input type="date" label="To" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div> : (
        <>
            <div className="overflow-x-auto">
            <table className="w-full">
                <TableHeader>
                    <TableHead>ADP Source</TableHead>
                    <TableHead>Mapping Proposal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Updated By</TableHead>
                    <TableHead>Actions</TableHead>
                </TableHeader>
                <tbody>
                    {(data?.content || []).length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-slate-500">No records found.</td></tr>
                    ) : (data?.content || []).map((row: any) => (
                        <TableRow key={row.adpId}>
                            <TableCell>
                                <div className="font-medium text-slate-900">{row.makeEnDesc} {row.modelEnDesc}</div>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">{row.adpMakeId} / {row.adpModelId}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <ArrowRight size={14} className="text-slate-300" />
                                    {row.status === 'MAPPED' ? (
                                        <div className="font-medium text-indigo-700">{row.sdMakeName} {row.sdModelName}</div>
                                    ) : (
                                        <div className="text-slate-500 italic">Partial / No Mapping</div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {renderStatus(row.status)}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                   <span className="text-sm text-slate-700">{row.updatedByName || row.updatedBy || 'Unknown'}</span>
                                   <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10}/> {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '-'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {!row.reviewedAt && (
                                        <>
                                            <Button variant="primary" className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(row.adpId)}>Approve</Button>
                                            <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => handleReject(row.adpId)}>Reject</Button>
                                        </>
                                    )}
                                    {row.reviewedAt && (
                                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded">
                                            <CheckCircle2 size={12}/> Reviewed
                                        </span>
                                    )}
                                </div>
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

      <Modal 
          isOpen={!!confirmAction} 
          onClose={() => setConfirmAction(null)} 
          title="Confirm Bulk Action"
          footer={
              <>
                  <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
                  <Button onClick={confirmBulkAction} className="bg-emerald-600 hover:bg-emerald-700">Confirm Approval</Button>
              </>
          }
      >
          <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                      <CheckCircle2 size={24} />
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800">Approve {confirmAction?.count} Mappings?</h3>
                      <p className="text-sm text-slate-500">This will mark the selected items as reviewed.</p>
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
};