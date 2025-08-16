// Helper function to fetch KPI & KTA TTA data for all departments
export async function fetchKpiKtaData(): Promise<{
  [department: string]: {
    kpiUtama: { rencana: number; aktual: number };
    ktaTta: { rencana: number; aktual: number };
    metadata: {
      department: string;
      month: number;
      year: number;
      monthName: string;
    };
  };
}> {
  const departments = ['MTCENG', 'ECDC', 'HETU', 'MMTC', 'PMTC'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  try {
    const fetchPromises = departments.map(async (dept) => {
      try {
        const params = new URLSearchParams({
          department: dept,
          month: currentMonth.toString(),
          year: currentYear.toString(),
        });
        
        const response = await fetch(`/api/dashboard/kpi-kta?${params.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          return {
            department: dept,
            data: {
              kpiUtama: data.kpiUtama,
              ktaTta: data.ktaTta,
              metadata: data.metadata,
            }
          };
        } else {
          // Return default data on error
          return {
            department: dept,
            data: {
              kpiUtama: { rencana: 186, aktual: 0 },
              ktaTta: { rencana: 186, aktual: 0 },
              metadata: {
                department: dept,
                month: currentMonth,
                year: currentYear,
                monthName: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(currentDate),
              }
            }
          };
        }
      } catch {
        // Return default data on error
        return {
          department: dept,
          data: {
            kpiUtama: { rencana: 186, aktual: 0 },
            ktaTta: { rencana: 186, aktual: 0 },
            metadata: {
              department: dept,
              month: currentMonth,
              year: currentYear,
              monthName: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(currentDate),
            }
          }
        };
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Convert array to object
    const kpiKtaData: { [department: string]: {
      kpiUtama: { rencana: number; aktual: number };
      ktaTta: { rencana: number; aktual: number };
      metadata: {
        department: string;
        month: number;
        year: number;
        monthName: string;
      };
    } } = {};
    results.forEach(result => {
      kpiKtaData[result.department] = result.data;
    });

    return kpiKtaData;
  } catch (error) {
    console.error('Error fetching KPI/KTA data:', error);
    
    // Return default data for all departments
    const defaultData: { [department: string]: {
      kpiUtama: { rencana: number; aktual: number };
      ktaTta: { rencana: number; aktual: number };
      metadata: {
        department: string;
        month: number;
        year: number;
        monthName: string;
      };
    } } = {};
    departments.forEach(dept => {
      defaultData[dept] = {
        kpiUtama: { rencana: 186, aktual: 0 },
        ktaTta: { rencana: 186, aktual: 0 },
        metadata: {
          department: dept,
          month: currentMonth,
          year: currentYear,
          monthName: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(currentDate),
        }
      };
    });
    
    return defaultData;
  }
}