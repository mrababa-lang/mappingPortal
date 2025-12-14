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
      if(!window.confirm("Reject and delete mapping?")) return;
      rejectMutation.mutate(id, {
          onSuccess: () => {
              toast.success("Mapping rejected");
              refetch();
          }
      });
  };

  const handleBulkAction = () => {
      if (!confirmAction) return;
      bulkMutation.mutate({
          action: confirmAction.type === 'approveAll' ? 'APPROVE' : 'REJECT',
          ids: confirmAction.ids
      }, {
          onSuccess: () => {
              toast.success("Bulk action completed");
              setConfirmAction(null);
              refetch();
          }
      });
  };

  const openBulkModal = (type: 'approveAll' | 'rejectAll') => {
      // Typically bulk actions apply to current selection or current page. 
      // For simplicity, let's apply to current page's visible IDs.
      const ids = data?.content?.map((i: any) => i.id) || [];
      if (ids.length === 0) return;
      setConfirmAction({ type, count: ids.length, ids });
  };

  const renderMappingDesc = (item: any) => {
      if(item.status === 'MISSING_MAKE') return <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={12}/> Make Missing</span>;
      if(item.status === 'MISSING_MODEL') return <span className="text-amber-500 flex items-center gap-1"><HelpCircle size={12}/> Model Missing</span>;
      return <span className="text-indigo-700">{item.sdMakeName} {item.sdModelName}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Mapping Review</h1>
           <p className="text-slate-500">Approve or reject pending mapping changes.</p>
        </div>

        <div className="flex flex-col gap-3 items-end">
            <div className="flex items-end gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex-wrap">
                <div className="flex items-center gap-2 px-2 text-slate-400 text-sm">
                <Filter size={16} />
                <span className="font-medium text-slate-600 hidden sm:inline">Filters:</span>
                </div>

                <div className="w-36">
                    <Select
                    label=""
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
                    options={[
                        { value: 'all', label: 'All Reviews' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'reviewed', label: 'Reviewed' }
                    ]}
                    className="py-1.5 text-xs"
                    />
                </div>

                <div className="w-36">
                    <Select
                    label=""
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value as any); setPage(1); }}
                    options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'MAPPED', label: 'Mapped' },
                        { value: 'MISSING_MODEL', label: 'Missing Model' },
                        { value: 'MISSING_MAKE', label: 'Missing Make' }
                    ]}
                    className="py-1.5 text-xs"
                    />
                </div>
                
                <div className="w-32 sm:w-36">
                    <Input label="" type="date" className="py-1.5 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="w-32 sm:w-36">
                    <Input label="" type="date" className="py-1.5 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                {(dateFrom || dateTo || statusFilter !== 'pending' || typeFilter !== 'all') && (
                <button 
                    onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter('pending'); setTypeFilter('all'); setPage(1); }} 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <X size={16} />
                </button>
                )}
            </div>

            {statusFilter === 'pending' && (data?.content?.length || 0) > 0 && (
                <div className="flex gap-2">
                    <Button variant="danger" className="h-9 text-xs" onClick={() => openBulkModal('rejectAll')}>
                        <Ban size={14} /> Reject Page
                    </Button>
                    <Button variant="primary" className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => openBulkModal('approveAll')}>
                        <CheckCircle2 size={14} /> Approve Page
                    </Button>
                </div>
            )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin"/></div> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>Status</TableHead>
              <TableHead>ADP Vehicle</TableHead>
              <TableHead>Mapped To</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {(data?.content || []).map((item: any) => {
                const isReviewed = !!item.reviewedAt;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {isReviewed ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                           <CheckCircle2 size={12} /> Reviewed
                         </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                           <Clock size={12} /> Pending
                         </span>
                      )}
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-700">{item.makeEnDesc} {item.modelEnDesc}</span>
                            <span className="text-xs text-slate-500">{item.adpMakeId} / {item.adpModelId}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                            <ArrowRight size={14} className="text-slate-300" />
                            {renderMappingDesc(item)}
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className="text-slate-900 text-sm">{item.updatedBy || 'System'}</span>
                    </TableCell>
                    <TableCell>
                        <span className="text-slate-500 text-xs">
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
                        </span>
                    </TableCell>
                    <TableCell>
                        {!isReviewed ? (
                             <div className="flex gap-2">
                                 <Button variant="secondary" className="h-8 px-3 text-xs text-emerald-700" onClick={() => handleApprove(item.id)}>
                                    <CheckCircle2 size={14} />
                                 </Button>
                                 <Button variant="secondary" className="h-8 px-3 text-xs text-red-600" onClick={() => handleReject(item.id)}>
                                    <XCircle size={14} />
                                 </Button>
                             </div>
                        ) : (
                            <span className="text-xs text-slate-400">Approved</span>
                        )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(data?.content || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
        <Pagination currentPage={page} totalPages={data?.totalPages || 1} onPageChange={setPage} totalItems={data?.totalElements || 0} />
      </Card>

      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'approveAll' ? 'Approve Page' : 'Reject Page'}
        footer={
          <>
             <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
             <Button 
               variant={confirmAction?.type === 'rejectAll' ? 'danger' : 'primary'}
               onClick={handleBulkAction}
             >
               Confirm
             </Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
           <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Bulk Action</h3>
           <p className="text-slate-500 text-sm">
             You are about to {confirmAction?.type === 'approveAll' ? 'approve' : 'reject'} {confirmAction?.count} items.
           </p>
        </div>
      </Modal>
    </div>
  );
};