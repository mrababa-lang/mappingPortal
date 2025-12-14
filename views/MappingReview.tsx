import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '../services/storageService';
import { ADPMapping, ADPMaster, Model, Make } from '../types';
import { Card, Button, TableHeader, TableHead, TableRow, TableCell, Select, Input, Pagination, Modal } from '../components/UI';
import { CheckCircle2, Clock, UserCheck, ArrowRight, AlertTriangle, HelpCircle, Filter, X, Check, Trash2, Ban, XCircle } from 'lucide-react';

export const MappingReviewView: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('pending'); // Review Status
  const [typeFilter, setTypeFilter] = useState<'all' | 'MAPPED' | 'MISSING_MAKE' | 'MISSING_MODEL'>('all'); // Mapping Type
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Confirmation Modals
  const [confirmAction, setConfirmAction] = useState<{ type: 'approveAll' | 'rejectAll', count: number } | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, statusFilter, typeFilter]);

  const refreshData = () => {
    const mappings = DataService.getADPMappings();
    const adpMaster = DataService.getADPMaster();
    const models = DataService.getModels();
    const makes = DataService.getMakes();

    // Combine data for display
    const reviewData = mappings.map(m => {
        const adp = adpMaster.find(a => a.id === m.adpId);
        let sdDesc = 'Unknown SD';
        let statusIcon = null;

        if (m.status === 'MISSING_MAKE') {
            sdDesc = 'Make Missing';
            statusIcon = <AlertTriangle size={14} className="text-red-500" />;
        } else if (m.status === 'MISSING_MODEL') {
            const make = m.makeId ? makes.find(mk => mk.id === m.makeId) : null;
            sdDesc = make ? `${make.name} (Model Missing)` : 'Unknown Make (Model Missing)';
            statusIcon = <HelpCircle size={14} className="text-amber-500" />;
        } else {
             // Standard Mapping
             const model = m.modelId ? models.find(mod => mod.id === m.modelId) : null;
             const make = model ? makes.find(mk => mk.id === model.makeId) : null;
             sdDesc = model && make ? `${make.name} ${model.name}` : 'Unknown SD';
        }

        const updatedByUser = m.updatedBy ? DataService.getUserName(m.updatedBy) : 'Unknown';
        const reviewedByUser = m.reviewedBy ? DataService.getUserName(m.reviewedBy) : null;

        return {
            ...m,
            adpDesc: adp ? `${adp.makeEnDesc} ${adp.modelEnDesc}` : 'Unknown ADP',
            adpDescAr: adp ? `${adp.makeArDesc} ${adp.modelArDesc}` : '',
            sdDesc,
            statusIcon,
            updatedByName: updatedByUser,
            reviewedByName: reviewedByUser
        };
    })
    // Sort by updated date descending
    .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    });

    setReviews(reviewData);
  };

  // Filter Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter(item => {
      // 1. Review Status Filter
      if (statusFilter === 'pending' && item.reviewedAt) return false;
      if (statusFilter === 'reviewed' && !item.reviewedAt) return false;

      // 2. Mapping Type Filter
      if (typeFilter !== 'all') {
         const itemStatus = item.status || 'MAPPED';
         if (itemStatus !== typeFilter) return false;
      }

      // 3. Date Range Filter (Using Updated At)
      if (dateFrom || dateTo) {
        if (!item.updatedAt) return false;
        const itemDate = new Date(item.updatedAt);
        
        if (dateFrom) {
          const start = new Date(dateFrom);
          start.setHours(0,0,0,0);
          if (itemDate < start) return false;
        }
        
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23,59,59,999);
          if (itemDate > end) return false;
        }
      }

      return true;
    });
  }, [reviews, statusFilter, typeFilter, dateFrom, dateTo]);

  // Actions
  const handleApprove = (mappingId: string) => {
    const mappings = DataService.getADPMappings();
    const index = mappings.findIndex(m => m.id === mappingId);
    if (index === -1) return;

    const updatedMappings = [...mappings];
    updatedMappings[index] = {
        ...updatedMappings[index],
        reviewedAt: new Date().toISOString(),
        reviewedBy: '1' // Simulated Current User ID
    };

    DataService.saveADPMappings(updatedMappings);
    refreshData();
  };

  const handleReject = (mappingId: string) => {
    if (!window.confirm("Rejecting this mapping will delete it and revert the ADP record to 'Unmapped'. Continue?")) return;

    const mappings = DataService.getADPMappings();
    const filteredMappings = mappings.filter(m => m.id !== mappingId);

    DataService.saveADPMappings(filteredMappings);
    refreshData();
  };

  const handleBulkAction = () => {
    if (!confirmAction) return;
    
    // Get IDs of currently filtered pending items
    const pendingIds = filteredReviews
        .filter(r => !r.reviewedAt)
        .map(r => r.id);
    
    const allMappings = DataService.getADPMappings();
    let updatedMappings = [...allMappings];

    if (confirmAction.type === 'approveAll') {
        updatedMappings = updatedMappings.map(m => {
            if (pendingIds.includes(m.id)) {
                return {
                    ...m,
                    reviewedAt: new Date().toISOString(),
                    reviewedBy: '1'
                };
            }
            return m;
        });
    } else if (confirmAction.type === 'rejectAll') {
        updatedMappings = updatedMappings.filter(m => !pendingIds.includes(m.id));
    }

    DataService.saveADPMappings(updatedMappings);
    refreshData();
    setConfirmAction(null);
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const pendingCount = filteredReviews.filter(r => !r.reviewedAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Mapping Review</h1>
           <p className="text-slate-500">Approve or reject pending mapping changes.</p>
        </div>

        <div className="flex flex-col gap-3 items-end">
             {/* Filters Toolbar */}
            <div className="flex items-end gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex-wrap">
                <div className="flex items-center gap-2 px-2 text-slate-400 text-sm">
                <Filter size={16} />
                <span className="font-medium text-slate-600 hidden sm:inline">Filters:</span>
                </div>

                <div className="w-36">
                    <Select
                    label=""
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
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
                    onChange={e => setTypeFilter(e.target.value as any)}
                    options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'MAPPED', label: 'Mapped' },
                        { value: 'MISSING_MODEL', label: 'Missing Model' },
                        { value: 'MISSING_MAKE', label: 'Missing Make' }
                    ]}
                    className="py-1.5 text-xs"
                    />
                </div>
                
                <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1"></div>

                <div className="w-32 sm:w-36">
                    <Input 
                    label="" 
                    type="date" 
                    className="py-1.5 text-xs" 
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    />
                </div>
                <span className="text-slate-400 pb-2 hidden sm:inline">-</span>
                <div className="w-32 sm:w-36">
                    <Input 
                    label="" 
                    type="date" 
                    className="py-1.5 text-xs"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    />
                </div>
                {(dateFrom || dateTo || statusFilter !== 'pending' || typeFilter !== 'all') && (
                <button 
                    onClick={() => {
                      setDateFrom(''); 
                      setDateTo(''); 
                      setStatusFilter('pending');
                      setTypeFilter('all');
                    }} 
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Reset Filters"
                >
                    <X size={16} />
                </button>
                )}
            </div>

            {/* Bulk Actions */}
            {statusFilter !== 'reviewed' && pendingCount > 0 && (
                <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Button 
                        variant="danger" 
                        className="h-9 text-xs"
                        onClick={() => setConfirmAction({ type: 'rejectAll', count: pendingCount })}
                    >
                        <Ban size={14} /> Reject All ({pendingCount})
                    </Button>
                    <Button 
                        variant="primary" 
                        className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setConfirmAction({ type: 'approveAll', count: pendingCount })}
                    >
                        <CheckCircle2 size={14} /> Approve All ({pendingCount})
                    </Button>
                </div>
            )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>Status</TableHead>
              <TableHead>ADP Vehicle</TableHead>
              <TableHead>Mapped To (SD)</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {paginatedReviews.map(item => {
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
                            <span className="font-medium text-slate-700">{item.adpDesc}</span>
                            {item.adpDescAr && (
                                <span className="text-xs text-slate-500" dir="rtl">{item.adpDescAr}</span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2 text-indigo-600 font-medium">
                            <ArrowRight size={14} className="text-slate-300" />
                            {item.statusIcon}
                            {item.sdDesc}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="text-slate-900">{item.updatedByName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className="text-slate-500 text-xs">
                            {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
                        </span>
                    </TableCell>
                    <TableCell>
                        {!isReviewed ? (
                             <div className="flex gap-2">
                                 <Button 
                                    variant="secondary"
                                    className="h-8 px-3 text-xs flex items-center gap-1.5 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 border-emerald-100"
                                    title="Approve"
                                    onClick={() => handleApprove(item.id)}
                                >
                                    <CheckCircle2 size={14} /> Approve
                                 </Button>
                                 <Button 
                                    variant="secondary"
                                    className="h-8 px-3 text-xs flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:border-red-200 border-red-100"
                                    title="Reject (Delete Mapping)"
                                    onClick={() => handleReject(item.id)}
                                >
                                    <XCircle size={14} /> Reject
                                 </Button>
                             </div>
                        ) : (
                            <div className="text-xs text-slate-400 flex flex-col">
                                <span>Approved by {item.reviewedByName}</span>
                                <span>{new Date(item.reviewedAt).toLocaleDateString()}</span>
                            </div>
                        )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No mapping activity found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredReviews.length}
        />
      </Card>

      {/* Bulk Action Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'approveAll' ? 'Approve All' : 'Reject All'}
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
           <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmAction?.type === 'rejectAll' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
             {confirmAction?.type === 'rejectAll' ? <Ban size={24} /> : <CheckCircle2 size={24} />}
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">
             {confirmAction?.type === 'approveAll' ? 'Approve All Pending?' : 'Reject All Pending?'}
           </h3>
           <p className="text-slate-500 text-sm">
             You are about to {confirmAction?.type === 'approveAll' ? 'approve' : 'reject'} <strong>{confirmAction?.count}</strong> pending items currently visible in the list.
             {confirmAction?.type === 'rejectAll' && <br/>}
             {confirmAction?.type === 'rejectAll' && <span className="text-red-600 font-semibold mt-2 block">This will permanently remove these mappings.</span>}
           </p>
        </div>
      </Modal>
    </div>
  );
};