
export const MOCK_DELAY = 400; // Simulate network latency

export const INITIAL_TYPES = [
  { id: '1', name: 'SUV', nameAr: 'سيارة دفع رباعي', description: 'Sport Utility Vehicle suitable for off-road and towing.', descriptionAr: 'سيارة رياضية متعددة الأغراض مناسبة للطرق الوعرة والقطر.' },
  { id: '2', name: 'Sedan', nameAr: 'سيدان', description: 'A passenger car with a separate trunk and three-box configuration.', descriptionAr: 'سيارة ركاب ذات صندوق منفصل وتكوين ثلاثي الصناديق.' },
  { id: '3', name: 'Coupe', nameAr: 'كوبيه', description: 'A car with a fixed roof and two doors.', descriptionAr: 'سيارة ذات سقف ثابت وبابين.' },
  { id: '4', name: 'Truck', nameAr: 'شاحنة', description: 'A motor vehicle designed to transport cargo.', descriptionAr: 'مركبة آلية مصممة لنقل البضائع.' },
];

export const INITIAL_MAKES = [
  { id: '1', name: 'Toyota', nameAr: 'تويوتا' },
  { id: '2', name: 'Ford', nameAr: 'فورد' },
  { id: '3', name: 'BMW', nameAr: 'بي ام دبليو' },
];

export const INITIAL_MODELS = [
  { id: '1', makeId: '1', typeId: '1', name: 'RAV4', nameAr: 'راف فور' },
  { id: '2', makeId: '1', typeId: '2', name: 'Camry', nameAr: 'كامري' },
  { id: '3', makeId: '2', typeId: '4', name: 'F-150', nameAr: 'اف-١٥٠' },
  { id: '4', makeId: '3', typeId: '2', name: '3 Series', nameAr: 'الفئة الثالثة' },
];

export const INITIAL_ADP_MASTER = [
  { 
    id: '1', 
    adpMakeId: 'TOY', makeEnDesc: 'Toyota', makeArDesc: 'تويوتا',
    adpModelId: 'RV4', modelEnDesc: 'RAV4', modelArDesc: 'راف فور',
    adpTypeId: 'SUV', typeEnDesc: 'Sport Utility', typeArDesc: 'سيارة دفع رباعي'
  },
  { 
    id: '2', 
    adpMakeId: 'FRD', makeEnDesc: 'Ford', makeArDesc: 'فورد',
    adpModelId: 'F150', modelEnDesc: 'F-150 Pickup', modelArDesc: 'اف-١٥٠',
    adpTypeId: 'TRK', typeEnDesc: 'Truck', typeArDesc: 'شاحنة'
  },
  { 
    id: '3', 
    adpMakeId: 'BMW', makeEnDesc: 'BMW', makeArDesc: 'بي ام دبليو',
    adpModelId: '3SR', modelEnDesc: '3 Series', modelArDesc: 'الفئة الثالثة',
    adpTypeId: 'SED', typeEnDesc: 'Sedan', typeArDesc: 'سيدان'
  },
];

// Helper to generate recent dates for mock data
const getRecentDate = (hoursAgo: number) => {
  const date = new Date();
  date.setTime(date.getTime() - (hoursAgo * 60 * 60 * 1000));
  return date.toISOString();
};

export const INITIAL_ADP_MAPPING = [
  { id: '1', modelId: '1', adpId: '1', updatedBy: '1', updatedAt: getRecentDate(2) }, // 2 hours ago by Admin
  { id: '2', modelId: '3', adpId: '2', updatedBy: '2', updatedAt: getRecentDate(25) }, // 25 hours ago by Editor
];

export const INITIAL_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@firsttech.ae', password: 'password', role: 'Admin', status: 'Active', lastActive: '2023-10-27 10:30 AM' },
  { id: '2', name: 'John Doe', email: 'john@firsttech.ae', password: 'password', role: 'Editor', status: 'Active', lastActive: '2023-10-26 04:15 PM' },
  { id: '3', name: 'Jane Smith', email: 'jane@firsttech.ae', password: 'password', role: 'Viewer', status: 'Inactive', lastActive: '2023-09-15 09:00 AM' },
];