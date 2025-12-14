import React, { useState, useEffect } from 'react';
import { useAppConfig, useUpdateAppConfig } from '../hooks/useAdminData';
import { AppConfig } from '../types';
import { Card, Button, Switch, Input } from '../components/UI';
import { Sparkles, Shield, AlertOctagon, Save, Activity, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ConfigurationView: React.FC = () => {
  const { data: serverConfig, isLoading } = useAppConfig();
  const updateConfigMutation = useUpdateAppConfig();
  
  const [localConfig, setLocalConfig] = useState<AppConfig | null>(null);

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
           <p className="text-slate-500">Manage global application settings and AI features.</p>
        </div>
        <Button onClick={handleSave} variant="primary" isLoading={updateConfigMutation.isPending}>
          <Save size={18} />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Configuration */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Sparkles className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Artificial Intelligence</h2>
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
               <div>
                 <h3 className="text-sm font-semibold text-slate-800">Enable AI Assistance</h3>
                 <p className="text-xs text-slate-500 mt-1">Allow AI to suggest mappings and generate descriptions using Google Gemini.</p>
               </div>
               <Switch 
                 checked={localConfig.enableAI} 
                 onChange={(val) => updateConfig('enableAI', val)} 
               />
             </div>

             <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                   <h3 className="text-sm font-semibold text-slate-800">Confidence Threshold</h3>
                   <span className="text-xs font-bold text-indigo-600">{localConfig.aiConfidenceThreshold}%</span>
                </div>
                <p className="text-xs text-slate-500">Minimum confidence score required for auto-suggestions.</p>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={localConfig.aiConfidenceThreshold}
                  onChange={(e) => updateConfig('aiConfidenceThreshold', parseInt(e.target.value))}
                  disabled={!localConfig.enableAI}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                />
             </div>

             <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Key size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gemini API Key</span>
                </div>
                <Input 
                   label=""
                   type="password"
                   placeholder="Enter API Key (Leave empty to use system default)"
                   value={localConfig.apiKey || ''}
                   onChange={(e) => updateConfig('apiKey', e.target.value)}
                   disabled={!localConfig.enableAI}
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                   Optional. Provide a specific Google Gemini API Key for this instance. If left blank, the system environment key will be used.
                </p>
             </div>
             
             {!localConfig.enableAI && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-md text-sm">
                   <AlertOctagon size={16} className="shrink-0 mt-0.5" />
                   <p>AI features are currently disabled. Users will not see suggestions for models or mappings.</p>
                </div>
             )}
          </div>
        </Card>

        {/* System Settings */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Shield className="text-emerald-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">System & Security</h2>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
               <div>
                 <h3 className="text-sm font-semibold text-slate-800">Maintenance Mode</h3>
                 <p className="text-xs text-slate-500 mt-1">Restrict access to Admins only. Useful during updates.</p>
               </div>
               <Switch 
                 checked={localConfig.maintenanceMode} 
                 onChange={(val) => updateConfig('maintenanceMode', val)} 
               />
             </div>

             <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
               <div>
                 <h3 className="text-sm font-semibold text-slate-800">Enable Audit Logging</h3>
                 <p className="text-xs text-slate-500 mt-1">Track comprehensive user actions in the history log.</p>
               </div>
               <Switch 
                 checked={localConfig.enableAuditLog} 
                 onChange={(val) => updateConfig('enableAuditLog', val)} 
               />
             </div>

             <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-slate-600 text-sm mb-2">
                   <Activity size={16} />
                   <span className="font-semibold">System Health</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                   <span className="text-xs text-slate-500">All systems operational. Remote API connected.</span>
                </div>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
};