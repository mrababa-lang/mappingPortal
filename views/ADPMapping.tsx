import React, { useState, useEffect } from 'react';
import { DataService } from '../services/storageService';
import { suggestMapping } from '../services/geminiService';
import { ADPMapping, Model, ADPMaster, Make, MappingStatus } from '../types';
import { Card, Button, Select, Modal, TableHeader, TableHead, TableRow, TableCell, Input, Pagination, SearchableSelect } from '../components/UI';
import { Edit2, Link, Unlink, AlertCircle, CheckCircle2, Filter, X, Download, HelpCircle, AlertTriangle, Search, History, Sparkles } from 'lucide-react';
import { HistoryModal } from '../components/HistoryModal';
import { toast } from 'sonner';

interface ADPMappingViewProps {
  initialParams?: {
    statusFilter?: 'all' | 'mapped' | 'unmapped' | 'issues';
    dateFrom?: string;
    dateTo?: string;
  };
}

export const ADPMappingView: React.FC<ADPMappingViewProps> = ({ initialParams }) => {
  const [adpList, setAdpList] = useState<ADPMaster[]>([]);
  const [mappings, setMappings] = useState<ADPMapping[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdpItem, setEditingAdpItem] = useState<ADPMaster | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyAdpId, setHistoryAdpId] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'mapped' | 'unmapped' | 'issues'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [mappingType, setMappingType] = useState<MappingStatus>('MAPPED');
  const [selectedMakeId, setSelectedMakeId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  // Apply initial filters if provided
  useEffect(() => {
    if (initialParams) {
      if (initialParams.statusFilter) setStatusFilter(initialParams.statusFilter);
      if (initialParams.dateFrom) setDateFrom(initialParams.dateFrom);
      if (initialParams.dateTo) setDateTo(initialParams.dateTo);
    }
  }, [initialParams]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, statusFilter, searchQuery]);

  const refreshData = () => {
    setAdpList(DataService.getADPMaster());
    setMappings(DataService.getADPMappings());
    setModels(DataService.getModels());
    setMakes(DataService.getMakes());
  };

  const getMappingForAdp = (adpId: string) => {
    return mappings.find(m => m.adpId === adpId);
  };

  const getSDModelDetails = (mapping?: ADPMapping) => {
    if (!mapping) return { makeId: '', makeName: '-', modelId: '', modelName: '-' };

    // Case 1: Standard Mapping
    if ((!mapping.status || mapping.status === 'MAPPED') && mapping.modelId) {
      const model = models.find(m => m.id === mapping.modelId);
      if (!model) return { makeId: '', makeName: 'Unknown', modelId: mapping.modelId, modelName: 'Unknown' };
      const make = makes.find(m => m.id === model.makeId);
      return {
        makeId: make?.id || '',
        makeName: make ? make.name : 'Unknown',
        modelId: model.id,
        modelName: model.name
      };
    }

    // Case 2: Missing Model (Make is known)
    if (mapping.status === 'MISSING_MODEL' && mapping.makeId) {
      const make = makes.find(m => m.id === mapping.makeId);
      return {
        makeId: mapping.makeId,
        makeName: make ? make.name : 'Unknown',
        modelId: '',
        modelName: 'N/A'
      };
    }

    // Case 3: Missing Make
    if (mapping.status === 'MISSING_MAKE') {
      return { makeId: '', makeName: 'N/A', modelId: '', modelName: 'N/A' };
    }

    return { makeId: '', makeName: '-', modelId: '', modelName: '-' };
  };

  const handleOpenModal = (adpItem: ADPMaster) => {
    setEditingAdpItem(adpItem);
    const mapping = getMappingForAdp(adpItem.id);
    
    // Default State
    setMappingType('MAPPED');
    setSelectedMakeId('');
    setSelectedModelId('');

    if (mapping) {
      setMappingType(mapping.status || 'MAPPED');
      
      if (mapping.status === 'MISSING_MODEL' && mapping.makeId) {
        setSelectedMakeId(mapping.makeId);
      } else if ((!mapping.status || mapping.status === 'MAPPED') && mapping.modelId) {
        const model = models.find(m => m.id === mapping.modelId);
        if (model) {
          setSelectedMakeId(model.makeId);
          setSelectedModelId(model.id);
        }
      }
    }
    
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingAdpItem) return;
    
    // Validation
    if (mappingType === 'MAPPED' && !selectedModelId) return;
    if (mappingType === 'MISSING_MODEL' && !selectedMakeId) return;

    const existingMappingIndex = mappings.findIndex(m => m.adpId === editingAdpItem.id);
    let newMappings = [...mappings];
    
    // Simulate current user (Admin)
    const currentUser = '1';
    const timestamp = new Date().toISOString();

    const mappingData: ADPMapping = {
      id: existingMappingIndex >= 0 ? mappings[existingMappingIndex].id : Date.now().toString(),
      adpId: editingAdpItem.id,
      updatedAt: timestamp,
      updatedBy: currentUser,
      status: mappingType,
      // Clear fields based on type
      modelId: mappingType === 'MAPPED' ? selectedModelId : undefined,
      makeId: mappingType === 'MISSING_MODEL' ? selectedMakeId : undefined,
    };

    if (existingMappingIndex >= 0) {
      newMappings[existingMappingIndex] = mappingData;
    } else {
      newMappings.push(mappingData);
    }

    DataService.saveADPMappings(newMappings);
    setMappings(newMappings); // Immediate Update
    setIsModalOpen(false);
    toast.success("Mapping saved successfully");
  };

  const initiateDelete = (adpId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop row click
    setItemToDelete(adpId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const adpId = itemToDelete;

    const filtered = mappings.filter(m => m.adpId !== adpId);
    DataService.saveADPMappings(filtered);
    setMappings(filtered); 

    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    toast.success("Mapping removed");
  };

  const handleAISuggest = async () => {
    if (!editingAdpItem) return;
    
    const description = `${editingAdpItem.makeEnDesc} ${editingAdpItem.modelEnDesc} (${editingAdpItem.typeEnDesc})`;
    
    setIsSuggesting(true);
    const suggestion = await suggestMapping(description);
    setIsSuggesting(false);

    if (suggestion) {
      if (suggestion.makeId) setSelectedMakeId(suggestion.makeId);
      if (suggestion.modelId) {
        setSelectedModelId(suggestion.modelId);
        setMappingType('MAPPED');
      } else if (suggestion.makeId) {
        setMappingType('MISSING_MODEL');
      }
      
      toast.success("AI Suggestion Applied", {
        description: suggestion.reasoning || "Matched based on description similarity."
      });
    } else {
      toast.info("AI could not find a confident match.");
    }
  };

  const openHistory = (adpId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryAdpId(adpId);
    setIsHistoryOpen(true);
  };

  // Filter models based on selected make
  const availableModels = models.filter(m => m.makeId === selectedMakeId);

  // Filter ADP List based on Status, Date Range, and SEARCH
  const filteredAdpList = adpList.filter(item => {
    const mapping = getMappingForAdp(item.id);
    const isMapped = !!mapping;

    // 1. Status Filter
    if (statusFilter === 'mapped') {
       if (!isMapped) return false;
       if (mapping?.status === 'MISSING_MAKE' || mapping?.status === 'MISSING_MODEL') return false;
    }
    if (statusFilter === 'unmapped' && isMapped) return false;
    if (statusFilter === 'issues') {
      if (!isMapped) return false;
      if (mapping?.status !== 'MISSING_MAKE' && mapping?.status !== 'MISSING_MODEL') return false;
    }

    // 2. Date Range Filter
    if (dateFrom || dateTo) {
        if (!mapping || !mapping.updatedAt) return false;
        const mapDate = new Date(mapping.updatedAt);
        
        if (dateFrom) {
          const start = new Date(dateFrom);
          start.setHours(0,0,0,0);
          if (mapDate < start) return false;
        }
        
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23,59,59,999);
          if (mapDate > end) return false;
        }
    }
    
    // 3. Search Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        
        // Check ADP Data
        const adpMatch = item.adpMakeId.toLowerCase().includes(query) ||
                         item.adpModelId.toLowerCase().includes(query) ||
                         item.makeEnDesc.toLowerCase().includes(query) ||
                         item.modelEnDesc.toLowerCase().includes(query) ||
                         (item.makeArDesc && item.makeArDesc.includes(searchQuery)) ||
                         (item.modelArDesc && item.modelArDesc.includes(searchQuery));

        // Check Mapped Data
        const { makeName, modelName, makeId, modelId } = getSDModelDetails(mapping);
        const sdMatch = makeName.toLowerCase().includes(query) || 
                        modelName.toLowerCase().includes(query) ||
                        makeId.toLowerCase().includes(query) ||
                        modelId.toLowerCase().includes(query);
                        
        if (!adpMatch && !sdMatch) return false;
    }

    return true;
  });

  const handleExport = () => {
    const csvRows = [];
    
    // Define Headers
    const headers = [
      'ADP Make ID', 'ADP Make En', 'ADP Make Ar',
      'ADP Model ID', 'ADP Model En', 'ADP Model Ar',
      'ADP Type ID', 'ADP Type En', 'ADP Type Ar',
      'SD Make ID', 'SD Make', 'SD Model ID', 'SD Model', 
      'Status', 'Status Detail',
      'Updated By', 'Updated At', 'Reviewed By', 'Reviewed At'
    ];
    csvRows.push(headers.join(','));

    // Generate Data Rows based on filtered list
    filteredAdpList.forEach(adpItem => {
      const mapping = getMappingForAdp(adpItem.id);
      const { makeName, modelName, makeId, modelId } = getSDModelDetails(mapping);
      const isMapped = !!mapping;
      
      const updatedByName = mapping?.updatedBy ? DataService.getUserName(mapping.updatedBy) : '';
      const reviewedByName = mapping?.reviewedBy ? DataService.getUserName(mapping.reviewedBy) : '';
      
      let statusLabel = 'Unmapped';
      if (isMapped) {
        if (mapping?.status === 'MISSING_MAKE') statusLabel = 'Make Missing';
        else if (mapping?.status === 'MISSING_MODEL') statusLabel = 'Model Missing';
        else statusLabel = 'Mapped';
      }

      const row = [
        adpItem.adpMakeId, adpItem.makeEnDesc, adpItem.makeArDesc,
        adpItem.adpModelId, adpItem.modelEnDesc, adpItem.modelArDesc,
        adpItem.adpTypeId, adpItem.typeEnDesc, adpItem.typeArDesc,
        makeId, makeName, modelId, modelName, 
        isMapped ? 'Mapped' : 'Unmapped', statusLabel,
        updatedByName, mapping?.updatedAt || '', reviewedByName, mapping?.reviewedAt || ''
      ].map(val => `"${String(val || '').replace(/"/g, '""')}"`);

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `adp_mapping_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (mapping?: ADPMapping) => {
    if (!mapping) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <AlertCircle size={12} /> Unmapped
        </span>
      );
    }

    if (mapping.status === 'MISSING_MAKE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
          <AlertTriangle size={12} /> Make Missing
        </span>
      );
    }

    if (mapping.status === 'MISSING_MODEL') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
          <HelpCircle size={12} /> Model Missing
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle2 size={12} /> Mapped
      </span>
    );
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredAdpList.length / ITEMS_PER_PAGE);
  const paginatedList = filteredAdpList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">ADP Mapping</h1>
           <p className="text-slate-500">Map ADP Master Data to SlashData Vehicle Models.</p>
        </div>
        
        <div className="flex flex-col gap-3 items-end">
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center w-full sm:w-auto">
            {/* Filters Toolbar */}
            <div className="flex items-end gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex-wrap w-full sm:w-auto">
              <div className="flex items-center gap-2 px-2 text-slate-400 text-sm">
                <Filter size={16} />
                <span className="font-medium text-slate-600 hidden sm:inline">Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="w-36">
                  <Select
                    label=""
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'mapped', label: 'Mapped Only' },
                      { value: 'issues', label: 'Missing Data' },
                      { value: 'unmapped', label: 'Unmapped' }
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

            <Button variant="secondary" onClick={handleExport} className="h-[52px] sm:h-[58px] self-stretch flex items-center shadow-sm">
              <Download size={18} />
              Export
            </Button>
          </div>
        </div>
      </div>
      
      {/* Search Bar - Full Width below filters */}
      <div className="relative w-full max-w-md">
         <Search className="absolute top-2.5 left-3 text-slate-400" size={16} />
         <input 
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slash-red/20 focus:border-slash-red/50 transition-all"
            placeholder="Search by ADP ID, Description, or SlashData Make/Model..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
         />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader>
              <TableHead>Make ID (ADP)</TableHead>
              <TableHead>Model ID (ADP)</TableHead>
              <TableHead>Vehicle Desc (ADP)</TableHead>
              <TableHead>SD Make</TableHead>
              <TableHead>SD Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableHeader>
            <tbody>
              {paginatedList.map(adpItem => {
                const mapping = getMappingForAdp(adpItem.id);
                const { makeName, modelName, makeId, modelId } = getSDModelDetails(mapping);
                const isMapped = !!mapping;

                return (
                  <TableRow key={adpItem.id} onClick={() => handleOpenModal(adpItem)}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {adpItem.adpMakeId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {adpItem.adpModelId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{adpItem.makeEnDesc} - {adpItem.modelEnDesc}</span>
                        <span className="text-xs text-slate-500 font-sans" dir="rtl">{adpItem.makeArDesc} - {adpItem.modelArDesc}</span>
                        <span className="text-xs text-slate-400 mt-1">{adpItem.typeEnDesc}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`font-medium ${isMapped && mapping?.status !== 'MISSING_MAKE' ? 'text-slate-900' : 'text-slate-300'}`}>
                          {makeName}
                        </span>
                        {makeId && <span className="text-[10px] font-mono text-slate-400">{makeId}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`font-medium ${isMapped && mapping?.status === 'MAPPED' ? 'text-slate-900' : 'text-slate-300'}`}>
                          {modelName}
                        </span>
                        {modelId && <span className="text-[10px] font-mono text-slate-400">{modelId}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {renderStatusBadge(mapping)}
                        {mapping?.updatedAt && (
                           <span className="text-[10px] text-slate-400">
                             {new Date(mapping.updatedAt).toLocaleDateString()}
                           </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                           variant="ghost" 
                           className="p-2 h-auto text-slate-500 hover:text-indigo-600"
                           onClick={(e) => openHistory(adpItem.id, e)}
                           title="Audit History"
                        >
                          <History size={16} />
                        </Button>
                        <Button variant="ghost" className="p-2 h-auto text-indigo-600 hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); handleOpenModal(adpItem); }}>
                          <Edit2 size={16} />
                        </Button>
                        {isMapped && (
                          <Button variant="ghost" className="p-2 h-auto text-red-500 hover:bg-red-50 hover:text-red-600" onClick={(e) => initiateDelete(adpItem.id, e)}>
                            <Unlink size={16} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAdpList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No records found matching filters.
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
          totalItems={filteredAdpList.length}
        />
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingAdpItem ? 'Edit Mapping' : 'Map Vehicle'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={
                (mappingType === 'MAPPED' && !selectedModelId) || 
                (mappingType === 'MISSING_MODEL' && !selectedMakeId)
              }
            >
              Save Mapping
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {editingAdpItem && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
              <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Target ADP Vehicle</h4>
                  <Button 
                    variant="ai" 
                    onClick={handleAISuggest} 
                    isLoading={isSuggesting}
                    className="text-xs py-1 h-7"
                    title="Auto-suggest mapping"
                  >
                    AI Suggest
                  </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">Make</span>
                  <span className="font-medium text-slate-900">{editingAdpItem.makeEnDesc} <span className="text-slate-400 font-mono">({editingAdpItem.adpMakeId})</span></span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Model</span>
                  <span className="font-medium text-slate-900">{editingAdpItem.modelEnDesc} <span className="text-slate-400 font-mono">({editingAdpItem.adpModelId})</span></span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
             <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
                  <Link size={16} className="text-indigo-500" />
                  Map to SlashData Vehicle
                </h4>
                
                {/* Status Selection */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4">
                   <button 
                      onClick={() => setMappingType('MAPPED')}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${mappingType === 'MAPPED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Standard Map
                   </button>
                   <button 
                      onClick={() => setMappingType('MISSING_MODEL')}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${mappingType === 'MISSING_MODEL' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Model Missing
                   </button>
                   <button 
                      onClick={() => setMappingType('MISSING_MAKE')}
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${mappingType === 'MISSING_MAKE' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                   >
                     Make Missing
                   </button>
                </div>
                
                {/* Form Fields based on Type */}
                {mappingType === 'MISSING_MAKE' ? (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p>This record will be flagged as <strong>Make Missing</strong>. Administrators can filter for these records to add the necessary Manufacturer data later.</p>
                  </div>
                ) : (
                  <>
                    <SearchableSelect 
                      label="Select SD Make"
                      value={selectedMakeId}
                      onChange={value => {
                        setSelectedMakeId(value);
                        setSelectedModelId(''); // Reset model when make changes
                      }}
                      options={makes.map(m => ({ value: m.id, label: m.name }))}
                      placeholder="Search for manufacturer..."
                    />
                    
                    {mappingType === 'MAPPED' && (
                      <SearchableSelect 
                        label="Select SD Model"
                        value={selectedModelId}
                        onChange={value => setSelectedModelId(value)}
                        options={availableModels.map(m => ({ value: m.id, label: m.name }))}
                        disabled={!selectedMakeId}
                        placeholder="Search for model..."
                      />
                    )}

                    {mappingType === 'MISSING_MODEL' && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                         <HelpCircle size={16} className="mt-0.5 shrink-0" />
                         <p>Select the Manufacturer above. The Model will be flagged as <strong>Missing</strong> in the system.</p>
                      </div>
                    )}
                    
                    {mappingType === 'MAPPED' && selectedMakeId && availableModels.length === 0 && (
                       <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                         No models found for this make. Please add models in the "Vehicle Models" section or mark as "Model Missing".
                       </p>
                    )}
                  </>
                )}
             </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Remove Mapping</Button>
          </>
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
             <AlertTriangle size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">Unlink Vehicle?</h3>
           <p className="text-slate-500 text-sm">
             Are you sure you want to remove this mapping? <br/>
             This will revert the ADP record to "Unmapped" status.
           </p>
        </div>
      </Modal>

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        adpId={historyAdpId}
      />
    </div>
  );
};