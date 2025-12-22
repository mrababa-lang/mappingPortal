
import React from 'react';

export interface VehicleType {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
}

export interface Make {
  id: string;
  name: string;
  nameAr?: string;
}

export interface Model {
  id: string;
  makeId: string;
  typeId: string;
  name: string;
  nameAr?: string;
}

export interface SlashMasterVehicle {
  modelId: string;
  modelName: string;
  modelNameAr?: string;
  makeId: string;
  makeName: string;
  makeNameAr?: string;
  typeId: string;
  typeName: string;
}

export interface ADPMaster {
  id: string;
  // Make
  adpMakeId: string;
  makeArDesc: string;
  makeEnDesc: string;
  // Model
  adpModelId: string;
  modelArDesc: string;
  modelEnDesc: string;
  // Type
  adpTypeId: string;
  typeArDesc: string;
  typeEnDesc: string;
  // Kind (New Fields)
  kindCode?: string;
  kindEnDesc?: string;
  kindArDesc?: string;
}

export type MappingStatus = 'MAPPED' | 'MISSING_MAKE' | 'MISSING_MODEL';

export interface ADPMapping {
  id: string;
  adpId: string;
  
  // Mapping Details
  modelId?: string; // Required if status is MAPPED
  makeId?: string;  // Required if status is MISSING_MODEL (to capture the make at least)
  status?: MappingStatus; // Defaults to 'MAPPED' if undefined

  updatedAt?: string;
  updatedBy?: string; // User ID
  reviewedAt?: string;
  reviewedBy?: string; // User ID
}

export interface ADPMakeMapping {
  adpMakeId: string;
  sdMakeId: string;
  updatedAt: string;
}

export interface ADPTypeMapping {
  adpTypeId: string;
  sdTypeId: string;
  updatedAt: string;
}

export interface ADPHistoryEntry {
  id: string;
  adpId: string;
  timestamp: string;
  userId: string;
  userFullName?: string;
  action: 'CREATED' | 'UPDATED' | 'REVIEWED' | 'REJECTED';
  details: string;
}

export type UserRole = 'ADMIN' | 'MAPPING_ADMIN' | 'MAPPING_USER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export interface AppConfig {
  enableAI: boolean;
  apiKey?: string; // Dynamic key from backend
  aiProvider: 'gemini' | 'openai';
  geminiApiKey?: string;
  openaiApiKey?: string;
  aiConfidenceThreshold: number; // 0-100
  systemInstruction: string;
  maintenanceMode: boolean;
  enableAuditLog: boolean;
}

export type ViewState = 'login' | 'dashboard' | 'types' | 'makes' | 'models' | 'slash-master' | 'adp-master' | 'adp-makes' | 'adp-types' | 'adp-matching' | 'adp-mapping' | 'adp-mapped-vehicles' | 'mapping-review' | 'users' | 'tracking' | 'configuration';

export interface NavItem {
  id: ViewState;
  label: string;
  icon: React.ComponentType<any>;
}
