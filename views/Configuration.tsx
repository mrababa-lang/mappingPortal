
import React, { useState, useEffect } from 'react';
import { useAppConfig, useUpdateAppConfig } from '../hooks/useAdminData';
import { AppConfig } from '../types';
import { Card, Button, Switch, Input, TextArea, Select } from '../components/UI';
import { Sparkles, Shield, AlertOctagon, Save, Activity, Loader2, Cpu, Globe, Zap, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

export const ConfigurationView: React.FC = () => {
  const { data: serverConfig, isLoading } = useAppConfig();
  const updateConfigMutation = useUpdateAppConfig();
  
  const [localConfig, setLocalConfig] = useState<AppConfig | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (serverConfig) {
      setLocalConfig(serverConfig);
    }
  }, [serverConfig]);

  const handleSave = () => {
    if (localConfig) {
      updateConfigMutation.mutate(localConfig, {
        onSuccess: () => toast.success("Configuration updated successfully.")
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Diagnostic call to verify AI availability
      await api.get('/config/test-ai-connection');
      toast.success(`${localConfig?.aiProvider === 'gemini' ? 'Gemini' : 'ChatGPT'} API is reachable and responding.`);
    } catch (e) {
      toast.error("API Connection Failed. Please check your keys and system instructions.");
    } finally {
      setIsTesting(false);
    }
  };

  const updateConfig = (key: keyof AppConfig, value: any) => {
    if (localConfig) {
      setLocalConfig({ ...localConfig, [key]: value });
    }
  };

  if (isLoading || !localConfig) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
           <p className="text-slate-500 text-sm">Manage global settings, AI orchestration, and system health.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={handleTestConnection} isLoading={isTesting} disabled={!localConfig.enableAI}>
                <Zap size={18} /> Test Connection
            </Button>
            <Button onClick={handleSave} variant="primary" isLoading={updateConfigMutation.isPending}>
              <Save size={18} /> Save Changes
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Orchestration Configuration */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={20} />
                <h2 className="text-lg font-bold text-slate-800">AI Intelligence Settings</h2>
            </div>
            <Switch 
                checked={localConfig.enableAI} 
                onChange={(val) => updateConfig('enableAI', val)} 
            />
          </div>
          
          <div className={`space-y-6 transition-opacity duration-300 ${!localConfig.enableAI ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
             <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Cpu size={14} /> AI Provider Selection
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => updateConfig('aiProvider', 'gemini')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${localConfig.aiProvider === 'gemini' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <Globe size={24} className={localConfig.aiProvider === 'gemini' ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className="text-sm font-bold mt-2">Google Gemini</span>
                        <span className="text-[10px] text-slate-500">Fast & Native</span>
                    </button>
                    <button 
                        onClick={() => updateConfig('aiProvider', 'openai')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${localConfig.aiProvider === 'openai' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                        <Zap size={24} className={localConfig.aiProvider === 'openai' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span className="text-sm font-bold mt-2">ChatGPT (OpenAI)</span>
                        <span className="text-[10px] text-slate-500">Premium Reasoning</span>
                    </button>
                </div>
             </div>

             <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Settings size={14} /> AI Prompt Customization
                </h3>
                <TextArea 
                    label="System Instruction (Base Prompt)"
                    placeholder="e.g., You are a specialized vehicle data cleaning agent for SlashData..."
                    value={localConfig.systemInstruction}
                    onChange={(e) => updateConfig('systemInstruction', e.target.value)}
                    rows={6}
                />
                <p className="text-[10px] text-slate-400 italic px-1">
                    This prompt is prepended to every AI request. Use it to define tone, formatting rules, or regional data specificities.
                </p>
             </div>

             <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                <div className="flex justify-between">
                   <h3 className="text-sm font-bold text-slate-800">Confidence Threshold</h3>
                   <span className="text-xs font-bold text-indigo-600 px-2 py-0.5 bg-indigo-100 rounded-full">{localConfig.aiConfidenceThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="100" 
                  value={localConfig.aiConfidenceThreshold}
                  onChange={(e) => updateConfig('aiConfidenceThreshold', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-[10px] text-slate-500">Minimum score for automatic match suggestions.</p>
             </div>
          </div>

          {!localConfig.enableAI && (
             <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs">
                <AlertOctagon size={16} className="shrink-0" />
                <p>AI assistance is globally disabled. Manual mapping will be required for all ADP records.</p>
             </div>
          )}
        </Card>

        {/* System & Security Policy */}
        <Card className="p-6 space-y-6 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Shield className="text-emerald-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Security & Operational Policy</h2>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-300 transition-colors">
               <div>
                 <h3 className="text-sm font-bold text-slate-800">Maintenance Mode</h3>
                 <p className="text-xs text-slate-500 mt-0.5">Locks the system for all users except Root Admins.</p>
               </div>
               <Switch 
                 checked={localConfig.maintenanceMode} 
                 onChange={(val) => updateConfig('maintenanceMode', val)} 
               />
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-300 transition-colors">
               <div>
                 <h3 className="text-sm font-bold text-slate-800">Full Audit Logging</h3>
                 <p className="text-xs text-slate-500 mt-0.5">Captures detailed diffs of every record change.</p>
               </div>
               <Switch 
                 checked={localConfig.enableAuditLog} 
                 onChange={(val) => updateConfig('enableAuditLog', val)} 
               />
             </div>

             <div className="p-5 bg-slate-900 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-300 text-sm mb-3">
                   <Activity size={16} />
                   <span className="font-bold uppercase tracking-wider text-xs">Diagnostic Pulse</span>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500">
                        <span>Database Connectivity</span>
                        <span className="text-emerald-500">Active</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[100%]"></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mt-2">
                        <span>API Server Latency</span>
                        <span className="text-indigo-400">24ms</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full w-[35%]"></div>
                    </div>
                </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
