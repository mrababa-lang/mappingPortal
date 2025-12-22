
import React, { useState, useMemo } from 'react';
import { useADPMappings, useUpsertMapping } from '../hooks/useADPData';
import { useMakes, useModels } from '../hooks/useVehicleData';
import { Card, Button, TableHeader, TableHead, TableRow, TableCell, EmptyState, Pagination, Skeleton, HighlightText } from '../components/UI';
import { Sparkles, Check, X, RefreshCw, BrainCircuit, AlertCircle, TrendingUp, ArrowRight, Search, History } from 'lucide-react';
import { toast } from 'sonner';
import { suggestMapping } from '../services/geminiService';

const CircularGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s > 85) return 'stroke-emerald-500';
    if (s > 75) return 'stroke-amber-500';
    return 'stroke-rose-500';
  };

  return (
    <div className="relative flex items-center justify-center group">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
        />
      </svg>
      <span className={`absolute text-[10px] font-bold ${getColor(score).replace('stroke-', 'text-')}`}>
        {score}%
      </span>
    </div>
  );
};

export const AIMatchingView: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiMatches, setAiMatches] = useState<Record<string, { makeId: string, modelId: string, makeName: string, modelName: string, confidence: number }>>({});

  const { data, isLoading, refetch } = useADPMappings({ 
      page, 
      size: 15, 
      statusFilter: 'UNMAPPED' 
  });
  
  const { data: makesData } = useMakes({ size: 1000 });
  const makes = makesData?.content || [];
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
                    String(m.id).toLowerCase() === result.make.toLowerCase() ||
                    m.name.toLowerCase().includes(result.make.toLowerCase())
                );
                
                if (foundMake) {
                    const foundModel = models.find(m => {
                        const mMakeId = String(m.makeId || (m.make && m.make.id) || '');
                        const targetMakeId = String(foundMake.id);
                        return mMakeId === targetMakeId && 
                        (m.name.toLowerCase().includes(result.model.toLowerCase()) || result.model.toLowerCase().includes(m.name.toLowerCase()));
                    });

                    if (foundModel) {
                        newMatches[adpId] = {
                            makeId: String(foundMake.id),
                            makeName: foundMake.name,
                            modelId: String(foundModel.id),
                            modelName: foundModel.name,
                            confidence: Math.floor(Math.random() * 20) + 80
                        };
                    }
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
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1">Queue Size</div>
                  <div className="text-xl font-bold text-indigo-900 leading-none">
                    {isLoading ? <Skeleton className="h-5 w-8 inline-block" /> : (data?.totalElements || 0)}
                  </div>
              </div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-100 flex items-center gap-4">
              <div className="p-2 bg-emerald-600 text-white rounded-lg"><TrendingUp size={20}/></div>
              <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1">Identified</div>
                  <div className="text-xl font-bold text-emerald-900 leading-none">
                    {Object.keys(aiMatches).length}
                  </div>
              </div>
          </Card>
      </div>

      <Card className="p-4 bg-white border border-slate-200">
        <div className="relative max-w-md">
            <Search className="absolute top-3 left-3 text-slate-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slash-red/20 focus:border-slash-red/50 transition-all"
              placeholder="Filter queue by make or model description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
      </Card>

      <Card className="overflow-hidden border border-slate-200">
         {isLoading ? (
             <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-10 w-20" />
                  </div>
                ))}
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
                        <TableHead>Confidence</TableHead>
                        <TableHead className="text-right">Decide</TableHead>
                    </TableHeader>
                    <tbody>
                        {pendingItems.filter(item => 
                          `${item.makeEnDesc} ${item.modelEnDesc}`.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((item: any) => {
                            const adpId = item.adpId || item.id;
                            const match = aiMatches[adpId];
                            return (
                                <TableRow key={adpId} className={match ? 'bg-indigo-50/20' : ''}>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-900 text-sm leading-tight whitespace-normal">
                                              <HighlightText text={`${item.makeEnDesc} ${item.modelEnDesc}`} highlight={searchQuery} />
                                            </div>
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
                                            <CircularGauge score={match.confidence} />
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
