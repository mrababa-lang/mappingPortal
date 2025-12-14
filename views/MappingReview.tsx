import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '../services/storageService';
import { ADPMapping, ADPMaster, Model, Make } from '../types';
import { Card, Button, TableHeader, TableHead, TableRow, TableCell, Select, Input, Pagination } from '../components/UI';
import { CheckCircle2, Clock, UserCheck, ArrowRight, AlertTriangle, HelpCircle, Filter, X } from 'lucide-react';

export const MappingReviewView: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    refreshData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, statusFilter]);

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

  const handleMarkReviewed = (mappingId: string) => {
    const mappings = DataService.getADPMappings();
    const index = mappings.findIndex(m => m.id === mappingId);
    if (index === -1) return;

    // Update with current user (simulated)
    const updatedMappings = [...mappings];
    updatedMappings[index] = {
        ...updatedMappings[index],
        reviewedAt: new Date().toISOString(),
        reviewedBy: '1' // Current User ID
    };

    DataService.saveADPMappings(updatedMappings);
    refreshData();
  };

  // Filter Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter(item => {
      // Status Filter
      if (statusFilter === 'pending' && item.reviewedAt) return false;
      if (statusFilter === 'reviewed' && !item.reviewedAt) return false;

      // Date Range Filter (Using Updated At)
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
  }, [reviews, statusFilter, dateFrom, dateTo]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Mapping Review</h1>
           <p className="text-slate-500">Review recent mapping changes and approve updates.</p>
        </div>

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
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending Review' },
                    { value: 'reviewed', label: 'Reviewed' }
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
             {(dateFrom || dateTo || statusFilter !== 'all') && (
               <button 
                  onClick={() => {setDateFrom(''); setDateTo(''); setStatusFilter('all');}} 
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Clear Filters"
               >
                 <X size={16} />
               </button>
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
                             <Button 
                                variant="primary" 
                                className="h-8 text-xs py-0 px-3 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10"
                                onClick={() => handleMarkReviewed(item.id)}
                            >
                                <UserCheck size={14} /> Mark Reviewed
                             </Button>
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
    </div>
  );
};