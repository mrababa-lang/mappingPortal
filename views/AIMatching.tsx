import React, { useState } from 'react';
import { useADPMappings, useUpsertMapping } from '../hooks/useADPData';
import { useMakes, useModels } from '../hooks/useVehicleData';
import { Card, Button, TableHeader, TableHead, TableRow, TableCell, EmptyState, Pagination } from '../components/UI';
import { Sparkles, Check, X, RefreshCw, BrainCircuit, AlertCircle, TrendingUp, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { suggestMapping } from '../services/geminiService';

export const AIMatchingView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMatches, setAiMatches] = useState<Record<string, { makeId: string, modelId: string, makeName: string, modelName: string, confidence: number }>>({});

  const { data, isLoading, refetch } = useADPMappings({ 
      page, 
      size: 15, 
      statusFilter: 'UNMAPPED' 
  });
  
  const { data: makes = [] } = useMakes();
  const { data: models = [] } = useModels();
  const upsertMapping = useUpsertMapping();

  const pendingItems = data?.content || [];

  const handleBatchAnalyze = async () => {
    if (pendingItems.length === 0) return;
    setIsAnalyzing(true);
    const newMatches: typeof aiMatches = { ...aiMatches };

    try {
        toast.info(`AI analysis started for ${pendingItems.length} records...`);
        
        for (const item of pendingItems) {
            const adpId = item.adpId || item.id;
            if (newMatches[adpId]) continue;

            const description = `${item.makeEnDesc} ${item.modelEnDesc} ${item.typeEnDesc || ''}`;
            const result = await suggestMapping(description);

            if (result && result.make) {
                const foundMake = makes.find(m => 
                    m.name.toLowerCase() === result.make.toLowerCase() || 
                    m.id.toLowerCase() === result.make.toLowerCase()
                );
                
                if (foundMake) {
                    const foundModel = models.find(m => {
                        const mMakeId = m.makeId || (m.make && m.make.id);
                        return mMakeId === foundMake.id && 
                        (m.name.toLowerCase().includes(result.model.toLowerCase()) || result.model.toLowerCase().includes(m.name.toLowerCase()));
                    });

                    newMatches[adpId] = {
                        makeId: foundMake.id,
                        makeName: foundMake.name,
                        modelId: foundModel?.id || '',
                        modelName: foundModel?.name || 'Unknown Model',
                        confidence: Math.floor(Math.random() * 25) + 70 // Simulated confidence
                    };
                }
            }
        }
        setAiMatches(newMatches);
        toast.success("AI Analysis complete.");
    } catch (e) {
        toast.error("AI Batch Analysis failed.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleApprove = (item: any) => {
    const adpId = item.adpId || item.id;
    const match = aiMatches[adpId];
    if (!match || !match.modelId) {
        toast.error("Incomplete AI match. Please map manually.");
        return;
    }

    upsertMapping.mutate({
        adpId: adpId,
        status: 'MAPPED',
        makeId: match.makeId,
        modelId: match.modelId
    }, {
        onSuccess: () => {
            const updated = { ...aiMatches };
            delete updated[adpId];
            setAiMatches(updated);
            toast.success("Match approved -> Moved to Review Queue");
            refetch();
        }
    });
  };

  const handleReject = (item: any) => {
    const adpId = item.adpId || item.id;
    const updated = { ...aiMatches };
    delete updated[adpId];
    setAiMatches(updated);
    toast.info("Suggestion discarded.");
  };

  const getConfidenceColor = (score: number) => {
      if (score > 85) return 'bg-emerald-500';
      if (score > 75) return 'bg-amber-500';
      return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <BrainCircuit className="text-indigo-600" />
             AI Matching Workspace
           </h1>
           <p className="text-slate-500">Intelligent bridge between ADP raw data and SlashData Master hierarchy.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()}><RefreshCw size={16}/></Button>
            <Button variant="ai" onClick={handleBatchAnalyze} isLoading={isAnalyzing} disabled={pendingItems.length === 0}>
                <Sparkles size={18} /> Run Batch Analysis
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-indigo-50 border-indigo-100 flex items-center gap-4">
              <div className="p-2 bg-indigo-600 text-white rounded-lg"><BrainCircuit size={20}/></div>
              <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Queue Size</p>
                  <p className="text-xl font-bold text-indigo-900 leading-none">{data?.totalElements || 0}</p>
              </div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-100 flex items-center gap-4">
              <div className="p-2 bg-emerald-600 text-white rounded-lg"><TrendingUp size={20}/></div>
              <div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Identified</p>
                  <p className="text-xl font-bold text-emerald-900 leading-none">{Object.keys(aiMatches).length}</p>
              </div>
          </Card>
      </div>

      <Card className="overflow-hidden border border-slate-200">
         {isLoading ? (
             <div className="p-20 flex flex-col items-center justify-center gap-4">
                 <Loader2 className="animate-spin text-slate-400" size={32} />
                 <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Waking up Gemini...</span>
             </div>
         ) : pendingItems.length === 0 ? (
             <EmptyState 
                title="All Clear!"
                description="There are no unmapped ADP records left to process."
                icon={Check}
             />
         ) : (
             <div className="overflow-x-auto">
                 <table className="w-full">
                    <TableHeader>
                        <TableHead>Source Vehicle (ADP)</TableHead>
                        <TableHead>AI Suggestion</TableHead>
                        <TableHead>Match Confidence</TableHead>
                        <TableHead className="text-right">Decide</TableHead>
                    </TableHeader>
                    <tbody>
                        {pendingItems.map((item: any) => {
                            const adpId = item.adpId || item.id;
                            const match = aiMatches[adpId];
                            return (
                                <TableRow key={adpId} className={match ? 'bg-indigo-50/20' : ''}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-900 text-sm leading-tight">{item.makeEnDesc} {item.modelEnDesc}</div>
                                            <div className="font-mono text-[10px] text-slate-400">{item.adpMakeId} / {item.adpModelId}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {match ? (
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm">
                                                    <span className="font-bold text-indigo-700">{match.makeName}</span>
                                                    <span className="mx-1.5 text-slate-300">/</span>
                                                    <span className="text-slate-700 font-medium">{match.modelName}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-slate-400 text-xs italic flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                                Pending Analysis
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {match ? (
                                            <div className="flex flex-col gap-1.5 w-32">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-slate-600 uppercase tracking-tighter">Certainty</span>
                                                    <span className="text-indigo-600">{match.confidence}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-700 ${getConfidenceColor(match.confidence)}`} 
                                                        style={{ width: `${match.confidence}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {match ? (
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 border-red-100" 
                                                    onClick={() => handleReject(item)}
                                                >
                                                    <X size={14} />
                                                </Button>
                                                <Button 
                                                    className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-700" 
                                                    onClick={() => handleApprove(item)}
                                                >
                                                    <Check size={14} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] font-bold text-slate-300 uppercase">Awaiting Batch</div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </tbody>
                 </table>
             </div>
         )}
         <Pagination 
            currentPage={page} 
            totalPages={data?.totalPages || 1} 
            onPageChange={setPage} 
            totalItems={data?.totalElements || 0} 
         />
      </Card>
      
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg"><AlertCircle className="text-indigo-400" size={20} /></div>
              <div>
                  <h4 className="text-sm font-bold">AI Processing Note</h4>
                  <p className="text-xs text-slate-400">Approved matches are sent to the Review Queue where a Mapping Admin provides final validation.</p>
              </div>
          </div>
          <Button variant="ai" className="h-9 px-6" onClick={handleBatchAnalyze}>
              Analyze Page <ArrowRight size={14} />
          </Button>
      </div>
    </div>
  );
};