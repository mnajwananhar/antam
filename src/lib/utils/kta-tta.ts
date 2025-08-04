import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate auto-increment registration number
 * Format: UPBE/YY/MM/XXX
 */
export async function generateNoRegister(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 25 for 2025
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  
  const prefix = `UPBE/${year}/${month}/`;
  
  // Find last number for this month
  const lastRecord = await prisma.ktaKpiData.findFirst({
    where: {
      noRegister: {
        startsWith: prefix
      }
    },
    orderBy: {
      noRegister: 'desc'
    }
  });
  
  let nextNumber = 1;
  if (lastRecord) {
    const lastNumber = parseInt(lastRecord.noRegister.split('/').pop() || '0');
    nextNumber = lastNumber + 1;
  }
  
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  return `${prefix}${formattedNumber}`;
}

/**
 * Calculate due date based on criteria KTA/TTA
 * Fixed mapping berdasarkan kriteria
 */
export async function calculateDueDate(tanggal: Date, kriteriaKtaTta: string): Promise<Date | null> {
  try {
    // Fixed mapping days berdasarkan kriteria (tidak pakai database)
    const kriteriaDaysMapping: Record<string, number> = {
      'Peralatan Bergerak': 14,
      'Pengelolaan Jalan dan Lalu lintas': 30,
      'Isolasi Energi': 7,
      'Pengelolaan Ban': 21,
      'Bekerja di dekat/atas air': 14,
      'Bejana bertekanan': 21,
      'Pelindung mesin / Mesin berat': 14,
      'Bahan kimia berbahaya dan beracun': 7,
      'House Keeping & Tata Lingkungan': 7,
      'Lain-lain': 21
    };
    
    const days = kriteriaDaysMapping[kriteriaKtaTta];
    if (!days) return null;
    
    const dueDate = new Date(tanggal);
    dueDate.setDate(dueDate.getDate() + days);
    
    return dueDate;
  } catch (error) {
    console.error('Error calculating due date:', error);
    return null;
  }
}

/**
 * Calculate update status based on Excel formula
 * =IFS(AND(S607<TODAY(),Q607="Open"),"Due Date",Q607="Close","Close",TRUE,"Proses")
 */
export function calculateUpdateStatus(dueDate: Date | null, statusTindakLanjut: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for comparison
  
  if (dueDate && statusTindakLanjut === 'OPEN') {
    const dueDateNormalized = new Date(dueDate);
    dueDateNormalized.setHours(0, 0, 0, 0);
    
    if (dueDateNormalized < today) {
      return 'Due Date'; // Overdue - Red
    }
  }
  
  if (statusTindakLanjut === 'CLOSE') {
    return 'Close'; // Completed - Green
  }
  
  return 'Proses'; // In Progress - Yellow
}

/**
 * Get status color for UI
 */
export function getStatusColor(updateStatus: string): string {
  switch (updateStatus) {
    case 'Close':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Due Date':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Proses':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Map PIC to department for filtering
 */
export const PIC_DEPARTMENT_MAPPING = {
  'ECDC': 'ECDC',
  'HE - TU': 'HETU',
  'Mine Electrical': 'MMTC',
  'Mine Maintenance': 'MMTC',
  'Plant Maintenance & Civil': 'PMTC'
} as const;

/**
 * Get allowed PIC options based on user role and department
 */
export function getAllowedPIC(userRole: string, userDepartment?: string, dataType: 'KTA_TTA' | 'KPI_UTAMA' = 'KTA_TTA'): string[] {
  const allPIC = Object.keys(PIC_DEPARTMENT_MAPPING);
  
  if (dataType === 'KPI_UTAMA') {
    // KPI Utama - hanya di MTC&ENG, tapi PIC bisa semua dept
    if (userDepartment === 'MTC&ENG Bureau' || userRole === 'INPUTTER' || userRole === 'ADMIN') {
      return allPIC; // Can select all departments
    }
    return []; // No access if not MTC&ENG
  } else {
    // KTA&TTA - semua dept kecuali MTC&ENG
    if (userDepartment === 'MTC&ENG Bureau') {
      return []; // MTC&ENG cannot access KTA&TTA
    }
    
    if (userRole === 'INPUTTER' || userRole === 'ADMIN') {
      return allPIC; // Can select all departments
    }
    
    if (userRole === 'PLANNER' && userDepartment) {
      // Planner can only select PIC that maps to their department
      return allPIC.filter(pic => 
        PIC_DEPARTMENT_MAPPING[pic as keyof typeof PIC_DEPARTMENT_MAPPING] === userDepartment
      );
    }
  }
  
  return [];
}

/**
 * Default criteria options for KTA/TTA
 */
export const KRITERIA_KTA_TTA_OPTIONS = [
  'Peralatan Bergerak',
  'Pengelolaan Jalan dan Lalu lintas',
  'Isolasi Energi',
  'Pengelolaan Ban',
  'Bekerja di dekat/atas air',
  'Bejana bertekanan',
  'Pelindung mesin / Mesin berat',
  'Bahan kimia berbahaya dan beracun',
  'House Keeping & Tata Lingkungan',
  'Lain-lain'
];

/**
 * Initialize default criteria (tanpa days)
 */
export async function initializeDefaultKriteria(): Promise<void> {
  const count = await prisma.kriteriaKtaTta.count();
  
  if (count === 0) {
    const defaultKriteria = [
      { kriteria: 'Peralatan Bergerak' },
      { kriteria: 'Pengelolaan Jalan dan Lalu lintas' },
      { kriteria: 'Isolasi Energi' },
      { kriteria: 'Pengelolaan Ban' },
      { kriteria: 'Bekerja di dekat/atas air' },
      { kriteria: 'Bejana bertekanan' },
      { kriteria: 'Pelindung mesin / Mesin berat' },
      { kriteria: 'Bahan kimia berbahaya dan beracun' },
      { kriteria: 'House Keeping & Tata Lingkungan' },
      { kriteria: 'Lain-lain' }
    ];
    
    await prisma.kriteriaKtaTta.createMany({
      data: defaultKriteria
    });
  }
}

/**
 * Check if user has access to specific data type
 */
export function hasDataTypeAccess(
  userRole: string, 
  userDepartment: string | undefined, 
  dataType: 'KTA_TTA' | 'KPI_UTAMA'
): boolean {
  if (userRole === 'ADMIN') return true;
  
  if (dataType === 'KPI_UTAMA') {
    // KPI Utama only for MTC&ENG Bureau
    return userDepartment === 'MTC&ENG Bureau' || userRole === 'INPUTTER';
  } else {
    // KTA&TTA for all departments except MTC&ENG Bureau
    return userDepartment !== 'MTC&ENG Bureau';
  }
}

/**
 * Smart mapping untuk kriteria dengan nomor urut
 * "01. Peralatan Bergerak" → "Peralatan Bergerak"
 */
export function cleanKriteriaKtaTta(kriteria: string): string {
  if (!kriteria) return kriteria;
  
  // Remove nomor urut di depan (format: "01. ", "02. ", dll)
  const cleaned = kriteria.replace(/^\d+\.\s*/, '').trim();
  
  // Mapping alternatif nama
  const kriteriaMapping: Record<string, string> = {
    'peralatan bergerak': 'Peralatan Bergerak',
    'pengelolaan jalan dan lalu lintas': 'Pengelolaan Jalan dan Lalu lintas',
    'pengelolaan jalan dan lalulintas': 'Pengelolaan Jalan dan Lalu lintas',
    'isolasi energi': 'Isolasi Energi',
    'pengelolaan ban': 'Pengelolaan Ban',
    'bekerja di dekat/atas air': 'Bekerja di dekat/atas air',
    'bekerja di dekat atas air': 'Bekerja di dekat/atas air',
    'bejana bertekanan': 'Bejana bertekanan',
    'pelindung mesin / mesin berat': 'Pelindung mesin / Mesin berat',
    'pelindung mesin mesin berat': 'Pelindung mesin / Mesin berat',
    'bahan kimia berbahaya dan beracun': 'Bahan kimia berbahaya dan beracun',
    'house keeping & tata lingkungan': 'House Keeping & Tata Lingkungan',
    'house keeping tata lingkungan': 'House Keeping & Tata Lingkungan',
    'housekeeping & tata lingkungan': 'House Keeping & Tata Lingkungan',
    'lain-lain': 'Lain-lain',
    'lain lain': 'Lain-lain'
  };
  
  const normalizedKey = cleaned.toLowerCase().trim();
  return kriteriaMapping[normalizedKey] || cleaned;
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(dateString?: string | Date): string {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch {
    return String(dateString);
  }
}
