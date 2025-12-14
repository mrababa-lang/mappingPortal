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

export interface ADPHistoryEntry {
  id: string;
  adpId: string;
  timestamp: string;
  userId: string;
  action: 'CREATED' | 'UPDATED' | 'REVIEWED' | 'REJECTED';
  details: string;
}

export type UserRole = 'Admin' | 'Mapping Admin' | 'Mapping User';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

export type ViewState = 'login' | 'dashboard' | 'types' | 'makes' | 'models' | 'adp-master' | 'adp-makes' | 'adp-mapping' | 'mapping-review' | 'users' | 'tracking';

export interface NavItem {
  id: ViewState;
  label: string;
  icon: React.ComponentType<any>;
}