import React, { useEffect, useState } from 'react';
import { DataService } from '../services/storageService';
import { ADPHistoryEntry } from '../types';
import { Modal } from './UI';
import { Button } from './UI';
import { Clock, UserCircle, CheckCircle2, AlertTriangle, FileEdit } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  adpId: string | null;
  title?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, adpId, title }) => {
  const [history, setHistory] = useState<ADPHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && adpId) {
      setLoading(true);
      // Simulate API delay
      setTimeout(() => {
        const data = DataService.getADPHistory(adpId);
        setHistory(data);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, adpId]);

  const getIcon = (action: string) => {
    switch (action) {
      case 'CREATED': return <Clock size={16} className="text-blue-500" />;
      case 'UPDATED': return <FileEdit size={16} className="text-indigo-500" />;
      case 'REVIEWED': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'REJECTED': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Audit History"}
      footer={
        <Button variant="secondary" onClick={onClose}>Close</Button>
      }
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No history records found.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-6 py-2">
            {history.map((entry) => (
              <div key={entry.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                   {/* Dot */}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    {getIcon(entry.action)}
                    <span>{entry.action}</span>
                    <span className="text-slate-300 mx-1">•</span>
                    <span className="text-xs font-normal text-slate-500">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600">{entry.details}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <UserCircle size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {DataService.getUserName(entry.userId)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};