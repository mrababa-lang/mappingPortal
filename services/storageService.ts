import { VehicleType, Make, Model, ADPMaster, ADPMapping, User, ADPMakeMapping, ADPHistoryEntry } from '../types';
import { INITIAL_TYPES, INITIAL_MAKES, INITIAL_MODELS, INITIAL_ADP_MASTER, INITIAL_USERS } from '../constants';

// Keys
const K_TYPES = 'slashdata_types';
const K_MAKES = 'slashdata_makes';
const K_MODELS = 'slashdata_models';
const K_ADP_MASTER = 'slashdata_adp_master';
const K_ADP_MAPPING = 'slashdata_adp_mapping';
const K_ADP_MAKE_MAPPING = 'slashdata_adp_make_mapping';
const K_USERS = 'slashdata_users';

// Helper to generate recent dates for mock data
const getRecentDate = (hoursAgo: number) => {
  const date = new Date();
  date.setTime(date.getTime() - (hoursAgo * 60 * 60 * 1000));
  return date.toISOString();
};

const INITIAL_ADP_MAPPING: ADPMapping[] = [
  { id: '1', modelId: '1', adpId: '1', updatedBy: '1', updatedAt: getRecentDate(2), reviewedAt: getRecentDate(1), reviewedBy: '1', status: 'MAPPED' }, // Reviewed
  { id: '2', modelId: '3', adpId: '2', updatedBy: '2', updatedAt: getRecentDate(25), status: 'MAPPED' }, // Not reviewed
];

// Helpers
const load = <T,>(key: string, initial: T[]): T[] => {
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const save = <T,>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const DataService = {
  getTypes: (): VehicleType[] => load(K_TYPES, INITIAL_TYPES),
  saveTypes: (data: VehicleType[]) => save(K_TYPES, data),
  
  getMakes: (): Make[] => load(K_MAKES, INITIAL_MAKES),
  saveMakes: (data: Make[]) => save(K_MAKES, data),
  
  getModels: (): Model[] => load(K_MODELS, INITIAL_MODELS),
  saveModels: (data: Model[]) => save(K_MODELS, data),
  
  getADPMaster: (): ADPMaster[] => load(K_ADP_MASTER, INITIAL_ADP_MASTER),
  saveADPMaster: (data: ADPMaster[]) => save(K_ADP_MASTER, data),
  
  getADPMappings: (): ADPMapping[] => load(K_ADP_MAPPING, INITIAL_ADP_MAPPING),
  saveADPMappings: (data: ADPMapping[]) => save(K_ADP_MAPPING, data),

  getADPMakeMappings: (): ADPMakeMapping[] => load(K_ADP_MAKE_MAPPING, []),
  saveADPMakeMappings: (data: ADPMakeMapping[]) => save(K_ADP_MAKE_MAPPING, data),

  getUsers: (): User[] => load(K_USERS, INITIAL_USERS as User[]),
  saveUsers: (data: User[]) => save(K_USERS, data),
  
  // Quick lookup helpers
  getMakeName: (id: string) => load(K_MAKES, INITIAL_MAKES).find(m => m.id === id)?.name || 'Unknown',
  getTypeName: (id: string) => load(K_TYPES, INITIAL_TYPES).find(t => t.id === id)?.name || 'Unknown',
  
  getADPCode: (id: string) => {
    const item = load(K_ADP_MASTER, INITIAL_ADP_MASTER).find(a => a.id === id);
    return item ? `${item.adpMakeId} ${item.modelEnDesc} (${item.typeEnDesc})` : 'Unknown';
  },
  
  getModelName: (id: string) => load(K_MODELS, INITIAL_MODELS).find(m => m.id === id)?.name || 'Unknown',
  getUserName: (id: string) => load(K_USERS, INITIAL_USERS as User[]).find(u => u.id === id)?.name || 'Unknown',

  // Mock History
  getADPHistory: (adpId: string): ADPHistoryEntry[] => {
    // Mock history generation based on current mapping
    const mapping = load(K_ADP_MAPPING, INITIAL_ADP_MAPPING).find(m => m.adpId === adpId);
    if (!mapping) return [];

    const history: ADPHistoryEntry[] = [];
    
    // Entry 1: Created/Updated
    if (mapping.updatedAt && mapping.updatedBy) {
       history.push({
         id: `hist-${adpId}-1`,
         adpId,
         timestamp: mapping.updatedAt,
         userId: mapping.updatedBy,
         action: 'UPDATED',
         details: `Mapping updated to status: ${mapping.status || 'MAPPED'}`
       });
    }

    // Entry 2: Reviewed
    if (mapping.reviewedAt && mapping.reviewedBy) {
       history.push({
         id: `hist-${adpId}-2`,
         adpId,
         timestamp: mapping.reviewedAt,
         userId: mapping.reviewedBy,
         action: 'REVIEWED',
         details: 'Mapping approved'
       });
    }

    // Add some random older history for demo
    history.push({
        id: `hist-${adpId}-0`,
        adpId,
        timestamp: getRecentDate(48), // 2 days ago
        userId: '1',
        action: 'CREATED',
        details: 'Initial import from ADP'
    });

    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};