// This file has been deprecated and removed. 
// Please use api.ts and relevant custom hooks (useVehicleData, useADPData, etc.) for data access.
export const DataService = {
  getAppConfig: () => ({ enableAI: true, aiConfidenceThreshold: 70 }), // Temporary stub for config until Config API is fully wired in views
  saveAppConfig: () => {},
  getUserName: (id: string) => "User " + id, // Temporary stub
};
