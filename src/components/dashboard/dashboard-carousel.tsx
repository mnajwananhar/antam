"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, RefreshCw, Play, Pause } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Import chart components
import { SafetyIncidentsChart } from "./mtceng/safety-incidents-chart"
import { EnergyIkesChart } from "./mtceng/energy-ikes-chart"
import { EnergyEmissionChart } from "./mtceng/energy-emission-chart"
import { EnergyConsumptionChart } from "./mtceng/energy-consumption-chart"
import { AvailabilityChart } from "./operational/availability-chart"
import { UtilizationChart } from "./operational/utilization-chart"
import { CriticalIssuesTable } from "./mtceng/critical-issues-table"
import {
  EquipmentStatusCard,
  NotificationSpeedometer,
  OrderSpeedometer,
  KpiKtaChart,
} from "./operational"

// Import filter components
import {
  SafetyFilters,
  EnergyFilters,
  ConsumptionFilters,
  CriticalIssuesFilters,
  type SafetyFilterState,
  type EnergyFilterState,
  type ConsumptionFilterState,
  type CriticalIssuesFilterState,
} from "@/components/dashboard/filters"
import { ProductivityFilters } from "@/components/dashboard/operational/productivity-filters"
import { fetchKpiKtaData } from "@/components/dashboard/helpers/fetch-kpi-kta"

interface EquipmentOption {
  id: number
  name: string
  code: string
  category: string
}

interface CriticalIssue {
  id: number
  issueName: string
  department: string
  status: string
  description: string
  createdAt: string
}

interface EquipmentStatus {
  id: number
  equipmentName: string
  equipmentCode: string
  status: "WORKING" | "STANDBY" | "BREAKDOWN"
  lastUpdated: string
  category: string
}

interface DepartmentData {
  // MTC&ENG specific data (available for all departments now)
  safetyIncidents: Array<{
    month: string
    nearmiss: number
    kecAlat: number
    kecKecil: number
    kecRingan: number
    kecBerat: number
    fatality: number
  }>
  energyIkes: Array<{
    month: string
    ikesTarget: number | null
    ikesRealization: number | null
  }>
  energyEmission: Array<{
    month: string
    emissionTarget: number | null
    emissionRealization: number | null
  }>
  energyConsumption: Array<{
    month: string
    tambang: number
    pabrik: number
    supporting: number
    total: number
  }>
  // Operational data
  availability: Array<{
    period: string
    pa: number | null
    ma: number | null
  }>
  utilization: Array<{
    period: string
    ua: number | null
    eu: number | null
  }>
  // Additional operational data
  criticalIssues: CriticalIssue[]
  equipmentStatus: EquipmentStatus[]
  availableEquipment: EquipmentOption[]
  notifications: {
    total: number
    completed: number
  }
  orders: {
    totalOrders: number
    totalActivities: number
    completedActivities: number
  }
  availableYears: number[]
}

interface DashboardData {
  departments?: {
    [key: string]: DepartmentData
  }
}

interface CarouselSlide {
  id: string
  title: string
  subtitle: string
  department: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>
}

interface DashboardCarouselProps {
  autoRotate?: boolean
  rotateInterval?: number
  selectedDepartment?: string | null // Filter by department: "ALL", "MTC&ENG", "OPERATIONAL", etc.
  onDepartmentChange?: (department: string) => void
}

export function DashboardCarousel({ 
  autoRotate = true, 
  rotateInterval = 8000,
  selectedDepartment = "MTCENG",
  onDepartmentChange
}: DashboardCarouselProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData>({})
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoRotate)

  const currentYear = new Date().getFullYear()

  // Helper function to get next department
  const getNextDepartment = (currentDept: string): string => {
    switch (currentDept) {
      case 'MTCENG':
        return 'ECDC'
      case 'ECDC':
        return 'HETU'
      case 'HETU':
        return 'MMTC'
      case 'MMTC':
        return 'PMTC'
      case 'PMTC':
        return 'MTCENG'
      default:
        return 'ECDC'
    }
  }

  // Filter states for different chart types
  const [safetyFilters, setSafetyFilters] = useState<SafetyFilterState>({
    year: currentYear,
    monthRange: { start: 1, end: 12 },
    incidentTypes: {
      nearmiss: true,
      kecAlat: true,
      kecKecil: true,
      kecRingan: true,
      kecBerat: true,
      fatality: true,
    },
    chartType: "stacked",
  })

  const [energyFilters, setEnergyFilters] = useState<EnergyFilterState>({
    year: currentYear,
    monthRange: { start: 1, end: 12 },
    showTarget: true,
    showRealization: true,
    comparisonMode: "target_vs_real",
    smoothLine: false,
  })

  const [consumptionFilters, setConsumptionFilters] = useState<ConsumptionFilterState>({
    year: currentYear,
    monthRange: { start: 1, end: 12 },
    areas: {
      tambang: true,
      pabrik: true,
      supporting: true,
    },
    showTotal: true,
    chartType: "combined",
    showTable: false,
    showAverage: false,
  })

  const [operationalFilters, setOperationalFilters] = useState({
    year: currentYear,
    period: "monthly" as "monthly" | "yearly",
  })

  const [criticalFilters, setCriticalFilters] =
    useState<CriticalIssuesFilterState>({
      departments: [],
      statuses: { WORKING: true, STANDBY: true, BREAKDOWN: true },
      dateRange: "all",
      sortBy: "newest",
      sortOrder: "desc",
      pageSize: 10,
    })

  const [productivityFilters, setProductivityFilters] = useState({
    selectedPeriod: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    selectedEquipment: [] as number[],
  })

  // KPI & KTA TTA data state
  const [kpiKtaData, setKpiKtaData] = useState<{
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
  }>({})


  // Manual refresh function
  const handleRefresh = async () => {
    setIsLoadingData(true)
    try {
      const departments = ['MTCENG', 'ECDC', 'HETU', 'MMTC', 'PMTC']
      
      const operationalParams = new URLSearchParams()
      operationalParams.set("period", "monthly")
      
      const [mtcengResponse, kpiKtaResponse, ...allResponses] = await Promise.all([
        fetch('/api/dashboard/mtceng').catch(() => null),
        fetchKpiKtaData().catch(() => ({})),
        ...departments.map(dept => 
          fetch(`/api/dashboard/operational?department=${dept}&${operationalParams.toString()}`).catch(() => null)
        )
      ])

      const departmentsData: { [key: string]: DepartmentData } = {}
      
      let mtcengBaseData = {
        safetyIncidents: [],
        energyIkes: [],
        energyEmission: [],
        energyConsumption: [],
        criticalIssues: [],
        equipmentStatus: [],
        availableEquipment: [],
        notifications: { total: 0, completed: 0 },
        orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
        availableYears: []
      }
      
      if (mtcengResponse?.ok) {
        const data = await mtcengResponse.json()
        mtcengBaseData = {
          safetyIncidents: data.safetyIncidents || [],
          energyIkes: data.energyIkes || [],
          energyEmission: data.energyEmission || [],
          energyConsumption: data.energyConsumption || [],
          criticalIssues: data.criticalIssues || [],
          equipmentStatus: [],
          availableEquipment: [],
          notifications: { total: 0, completed: 0 },
          orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
          availableYears: data.availableYears || []
        }
      }

      const deptPromises = allResponses.map(async (response, index) => {
        const dept = departments[index]
        
        if (response?.ok) {
          try {
            const data = await response.json()
            const productivityData = data.productivityData || []
            
            return {
              dept,
              data: {
                ...mtcengBaseData,
                availability: productivityData.map((item: { period: string; pa: number | null; ma: number | null }) => ({
                  period: item.period,
                  pa: item.pa,
                  ma: item.ma
                })),
                utilization: productivityData.map((item: { period: string; ua: number | null; eu: number | null }) => ({
                  period: item.period,
                  ua: item.ua,
                  eu: item.eu
                })),
                criticalIssues: data.criticalIssues || [],
                equipmentStatus: data.equipmentStatus || [],
                availableEquipment: data.availableEquipment || [],
                notifications: data.notifications || { total: 0, completed: 0 },
                orders: data.orders || { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
                availableYears: data.availableYears || []
              }
            }
          } catch {
            return {
              dept,
              data: { 
                ...mtcengBaseData,
                availability: [], 
                utilization: [],
                criticalIssues: [],
                equipmentStatus: [],
                availableEquipment: [],
                notifications: { total: 0, completed: 0 },
                orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
                availableYears: []
              }
            }
          }
        } else {
          return {
            dept,
            data: { 
              ...mtcengBaseData,
              availability: [], 
              utilization: [],
              criticalIssues: [],
              equipmentStatus: [],
              availableEquipment: [],
              notifications: { total: 0, completed: 0 },
              orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
              availableYears: []
            }
          }
        }
      })

      const deptResults = await Promise.all(deptPromises)
      deptResults.forEach(result => {
        departmentsData[result.dept] = result.data
      })

      setDashboardData({
        departments: departmentsData
      })
      
      // Set KPI/KTA data
      setKpiKtaData(kpiKtaResponse as { [department: string]: { kpiUtama: { rencana: number; aktual: number }; ktaTta: { rencana: number; aktual: number }; metadata: { department: string; month: number; year: number; monthName: string } } })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    // Call fetch only once on mount
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const departments = ['MTCENG', 'ECDC', 'HETU', 'MMTC', 'PMTC']
        
        const operationalParams = new URLSearchParams()
        operationalParams.set("period", "monthly")
        
        const [mtcengResponse, kpiKtaResponse, ...allResponses] = await Promise.all([
          fetch('/api/dashboard/mtceng').catch(() => null),
          fetchKpiKtaData().catch(() => ({})),
          ...departments.map(dept => 
            fetch(`/api/dashboard/operational?department=${dept}&${operationalParams.toString()}`).catch(() => null)
          )
        ])

        const departmentsData: { [key: string]: DepartmentData } = {}
        
        let mtcengBaseData = {
          safetyIncidents: [],
          energyIkes: [],
          energyEmission: [],
          energyConsumption: [],
          criticalIssues: [],
          equipmentStatus: [],
          availableEquipment: [],
          notifications: { total: 0, completed: 0 },
          orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
          availableYears: []
        }
        
        if (mtcengResponse?.ok) {
          const data = await mtcengResponse.json()
          mtcengBaseData = {
            safetyIncidents: data.safetyIncidents || [],
            energyIkes: data.energyIkes || [],
            energyEmission: data.energyEmission || [],
            energyConsumption: data.energyConsumption || [],
            criticalIssues: data.criticalIssues || [],
            equipmentStatus: [],
            availableEquipment: [],
            notifications: { total: 0, completed: 0 },
            orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
            availableYears: data.availableYears || []
          }
        }

        const deptPromises = allResponses.map(async (response, index) => {
          const dept = departments[index]
          
          if (response?.ok) {
            try {
              const data = await response.json()
              const productivityData = data.productivityData || []
              
              return {
                dept,
                data: {
                  ...mtcengBaseData,
                  availability: productivityData.map((item: { period: string; pa: number | null; ma: number | null }) => ({
                    period: item.period,
                    pa: item.pa,
                    ma: item.ma
                  })),
                  utilization: productivityData.map((item: { period: string; ua: number | null; eu: number | null }) => ({
                    period: item.period,
                    ua: item.ua,
                    eu: item.eu
                  })),
                  criticalIssues: data.criticalIssues || [],
                  equipmentStatus: data.equipmentStatus || [],
                  availableEquipment: data.availableEquipment || [],
                  notifications: data.notifications || { total: 0, completed: 0 },
                  orders: data.orders || { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
                  availableYears: data.availableYears || []
                }
              }
            } catch {
              return {
                dept,
                data: { 
                  ...mtcengBaseData,
                  availability: [], 
                  utilization: [],
                  criticalIssues: [],
                  equipmentStatus: [],
                  availableEquipment: [],
                  notifications: { total: 0, completed: 0 },
                  orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
                  availableYears: []
                }
              }
            }
          } else {
            return {
              dept,
              data: { 
                ...mtcengBaseData,
                availability: [], 
                utilization: [],
                criticalIssues: [],
                equipmentStatus: [],
                availableEquipment: [],
                notifications: { total: 0, completed: 0 },
                orders: { totalOrders: 0, totalActivities: 0, completedActivities: 0 },
                availableYears: []
              }
            }
          }
        })

        const deptResults = await Promise.all(deptPromises)
        deptResults.forEach(result => {
          departmentsData[result.dept] = result.data
        })

        setDashboardData({
          departments: departmentsData
        })
        
        // Set KPI/KTA data
        setKpiKtaData(kpiKtaResponse as { [department: string]: { kpiUtama: { rencana: number; aktual: number }; ktaTta: { rencana: number; aktual: number }; metadata: { department: string; month: number; year: number; monthName: string } } })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
    
    // Auto refresh every 10 minutes to reduce server load
    const interval = setInterval(loadData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, []) // Empty dependency - only run once on mount

  // Get all unique available years from all departments
  const getAllAvailableYears = useCallback(() => {
    const allYears = new Set<number>()
    
    Object.values(dashboardData.departments || {}).forEach(deptData => {
      deptData.availableYears?.forEach(year => allYears.add(year))
    })
    
    return Array.from(allYears).sort((a, b) => b - a) // Sort descending
  }, [dashboardData])

  const availableYears = getAllAvailableYears()

  // Filter data based on current filters (like in dashboard detail)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFilteredSafetyData = useCallback((deptData: any) => {
    if (!deptData?.safetyIncidents) return [];

    return deptData.safetyIncidents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any, index: number) => {
        const monthNum = index + 1;
        return (
          monthNum >= safetyFilters.monthRange.start &&
          monthNum <= safetyFilters.monthRange.end
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        ...item,
        nearmiss: safetyFilters.incidentTypes.nearmiss ? item.nearmiss : 0,
        kecAlat: safetyFilters.incidentTypes.kecAlat ? item.kecAlat : 0,
        kecKecil: safetyFilters.incidentTypes.kecKecil ? item.kecKecil : 0,
        kecRingan: safetyFilters.incidentTypes.kecRingan ? item.kecRingan : 0,
        kecBerat: safetyFilters.incidentTypes.kecBerat ? item.kecBerat : 0,
        fatality: safetyFilters.incidentTypes.fatality ? item.fatality : 0,
      }));
  }, [safetyFilters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFilteredEnergyIkesData = useCallback((deptData: any) => {
    if (!deptData?.energyIkes) return [];

    return deptData.energyIkes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((_: any, index: number) => {
        const monthNum = index + 1;
        return (
          monthNum >= energyFilters.monthRange.start &&
          monthNum <= energyFilters.monthRange.end
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        ...item,
        ikesTarget: energyFilters.showTarget ? item.ikesTarget : null,
        ikesRealization: energyFilters.showRealization
          ? item.ikesRealization
          : null,
      }));
  }, [energyFilters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFilteredEnergyEmissionData = useCallback((deptData: any) => {
    if (!deptData?.energyEmission) return [];

    return deptData.energyEmission
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((_: any, index: number) => {
        const monthNum = index + 1;
        return (
          monthNum >= energyFilters.monthRange.start &&
          monthNum <= energyFilters.monthRange.end
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        ...item,
        emissionTarget: energyFilters.showTarget ? item.emissionTarget : null,
        emissionRealization: energyFilters.showRealization
          ? item.emissionRealization
          : null,
      }));
  }, [energyFilters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFilteredConsumptionData = useCallback((deptData: any) => {
    if (!deptData?.energyConsumption) return [];

    return deptData.energyConsumption
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((_: any, index: number) => {
        const monthNum = index + 1;
        return (
          monthNum >= consumptionFilters.monthRange.start &&
          monthNum <= consumptionFilters.monthRange.end
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ({
        ...item,
        tambang: consumptionFilters.areas.tambang ? item.tambang : 0,
        pabrik: consumptionFilters.areas.pabrik ? item.pabrik : 0,
        supporting: consumptionFilters.areas.supporting ? item.supporting : 0,
        total: consumptionFilters.showTotal ? item.total : 0,
      }));
  }, [consumptionFilters]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFilteredCriticalIssues = useCallback((deptData: any) => {
    if (!deptData?.criticalIssues) return [];

    let filtered = deptData.criticalIssues;

    // Department filter
    if (criticalFilters.departments.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((issue: any) =>
        criticalFilters.departments.includes(issue.department)
      );
    }

    // Status filter
    const enabledStatuses = Object.entries(criticalFilters.statuses)
      .filter(([, enabled]) => enabled)
      .map(([status]) => status);

    if (enabledStatuses.length < 3) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((issue: any) =>
        enabledStatuses.includes(issue.status)
      );
    }

    // Sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filtered.sort((a: any, b: any) => {
      let comparison = 0;

      switch (criticalFilters.sortBy) {
        case "newest":
          comparison =
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "oldest":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "department":
          comparison = a.department.localeCompare(b.department);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "priority":
          // Simple priority: BREAKDOWN > STANDBY > WORKING
          const priorityOrder = { BREAKDOWN: 3, STANDBY: 2, WORKING: 1 };
          comparison =
            (priorityOrder[b.status as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.status as keyof typeof priorityOrder] || 0);
          break;
      }

      return criticalFilters.sortOrder === "desc" ? comparison : -comparison;
    });

    // Pagination
    return filtered.slice(0, criticalFilters.pageSize);
  }, [criticalFilters]);

  // Update year when available years are loaded
  useEffect(() => {
    if (availableYears.length > 0) {
      const latestYear = availableYears[0]
      
      // Update operational filters
      if (!availableYears.includes(operationalFilters.year)) {
        setOperationalFilters(prev => ({
          ...prev,
          year: latestYear
        }))
      }
      
      // Update safety filters
      if (!availableYears.includes(safetyFilters.year)) {
        setSafetyFilters(prev => ({
          ...prev,
          year: latestYear
        }))
      }
      
      // Update energy filters
      if (!availableYears.includes(energyFilters.year)) {
        setEnergyFilters(prev => ({
          ...prev,
          year: latestYear
        }))
      }
      
      // Update consumption filters
      if (!availableYears.includes(consumptionFilters.year)) {
        setConsumptionFilters(prev => ({
          ...prev,
          year: latestYear
        }))
      }
    }
  }, [availableYears, operationalFilters.year, safetyFilters.year, energyFilters.year, consumptionFilters.year])

  // Auto-select first equipment for operational departments when available equipment loads
  useEffect(() => {
    if (dashboardData.departments) {
      // Check each operational department
      const operationalDepts = ['MMTC', 'PMTC', 'ECDC', 'HETU']
      
      operationalDepts.forEach(dept => {
        const deptData = dashboardData.departments?.[dept]
        if (deptData?.availableEquipment && deptData.availableEquipment.length > 0 && productivityFilters.selectedEquipment.length === 0) {
          setProductivityFilters(prev => ({
            ...prev,
            selectedEquipment: [deptData.availableEquipment[0].id]
          }))
        }
      })
    }
  }, [dashboardData.departments, productivityFilters.selectedEquipment.length])

  // Define all slides with actual chart components - different charts per department type
  const allSlides: CarouselSlide[] = [
    // MTCENG Department - KPI Utama first, then other charts
    ...(['MTCENG'].flatMap(dept => [
      // KPI Utama Chart (First for MTCENG)
      {
        id: `${dept.toLowerCase()}-kpi-utama`,
        title: "KPI Utama",
        subtitle: `${dept} Department`,
        department: dept,
        component: KpiKtaChart,
        props: {
          kpiData: kpiKtaData[dept]?.kpiUtama,
          ktaData: kpiKtaData[dept]?.ktaTta,
          department: dept,
          currentMonth: kpiKtaData[dept]?.metadata?.monthName || new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date()),
          isLoading: isLoadingData
        }
      },
      // Safety Incidents Chart
      {
        id: `${dept.toLowerCase()}-safety-incidents`,
        title: "Safety Incidents",
        subtitle: `${dept} Department`,
        department: dept,
        component: SafetyIncidentsChart,
        props: {
          data: getFilteredSafetyData(dashboardData.departments?.[dept]),
          chartType: safetyFilters.chartType
        }
      },
      // Energy IKES Chart
      {
        id: `${dept.toLowerCase()}-energy-ikes`,
        title: "IKES Performance",
        subtitle: `${dept} Department`,
        department: dept, 
        component: EnergyIkesChart,
        props: {
          data: getFilteredEnergyIkesData(dashboardData.departments?.[dept])
        }
      },
      // Energy Emission Chart
      {
        id: `${dept.toLowerCase()}-energy-emission`,
        title: "Emission Performance",
        subtitle: `${dept} Department`,
        department: dept,
        component: EnergyEmissionChart,
        props: {
          data: getFilteredEnergyEmissionData(dashboardData.departments?.[dept])
        }
      },
      // Energy Consumption Chart
      {
        id: `${dept.toLowerCase()}-energy-consumption`,
        title: "Energy Consumption",
        subtitle: `${dept} Department`, 
        department: dept,
        component: EnergyConsumptionChart,
        props: {
          data: getFilteredConsumptionData(dashboardData.departments?.[dept]),
          chartType: consumptionFilters.chartType,
          showTable: consumptionFilters.showTable,
          showAverage: consumptionFilters.showAverage
        }
      },
      // Critical Issues Table
      {
        id: `${dept.toLowerCase()}-critical-issues`,
        title: "Critical Issues",
        subtitle: `${dept} Department`,
        department: dept,
        component: CriticalIssuesTable,
        props: {
          data: getFilteredCriticalIssues(dashboardData.departments?.[dept]),
          isLoading: isLoadingData,
          departmentFilter: dept
        }
      }
    ])),
    
    // Operational Departments - KTA TTA first, then other charts
    ...(['ECDC', 'HETU', 'MMTC', 'PMTC'].flatMap(dept => [
      // KTA TTA Chart (First for operational departments)
      {
        id: `${dept.toLowerCase()}-kta-tta`,
        title: "KTA & TTA",
        subtitle: `${dept} Department`,
        department: dept,
        component: KpiKtaChart,
        props: {
          kpiData: kpiKtaData[dept]?.kpiUtama,
          ktaData: kpiKtaData[dept]?.ktaTta,
          department: dept,
          currentMonth: kpiKtaData[dept]?.metadata?.monthName || new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date()),
          isLoading: isLoadingData
        }
      },
      // Availability Chart
      {
        id: `${dept.toLowerCase()}-availability`,
        title: "Equipment Availability",
        subtitle: `${dept} Department`,
        department: dept,
        component: AvailabilityChart,
        props: {
          data: dashboardData.departments?.[dept]?.availability || [],
          isLoading: isLoadingData,
          title: "Physical & Mechanical Availability",
          description: `${dept} - PA vs MA Performance Metrics`
        }
      },
      // Utilization Chart
      {
        id: `${dept.toLowerCase()}-utilization`,
        title: "Equipment Utilization", 
        subtitle: `${dept} Department`,
        department: dept,
        component: UtilizationChart,
        props: {
          data: dashboardData.departments?.[dept]?.utilization || [],
          isLoading: isLoadingData,
          title: "Use of Availability & Effective Utilization",
          description: `${dept} - UA vs EU Performance Metrics`
        }
      },
      // Equipment Status Card
      {
        id: `${dept.toLowerCase()}-equipment-status`,
        title: "Equipment Status",
        subtitle: `${dept} Department`,
        department: dept,
        component: EquipmentStatusCard,
        props: {
          data: dashboardData.departments?.[dept]?.equipmentStatus || [],
          isLoading: isLoadingData,
          departmentFilter: dept
        }
      },
      // Notification Speedometer
      {
        id: `${dept.toLowerCase()}-notifications`,
        title: "Notification Progress",
        subtitle: `${dept} Department`,
        department: dept,
        component: NotificationSpeedometer,
        props: {
          totalNotifications: dashboardData.departments?.[dept]?.notifications?.total || 0,
          completedNotifications: dashboardData.departments?.[dept]?.notifications?.completed || 0,
          isLoading: isLoadingData,
          departmentFilter: dept
        }
      },
      // Order Speedometer
      {
        id: `${dept.toLowerCase()}-orders`,
        title: "Order Progress", 
        subtitle: `${dept} Department`,
        department: dept,
        component: OrderSpeedometer,
        props: {
          totalOrders: dashboardData.departments?.[dept]?.orders?.totalOrders || 0,
          totalActivities: dashboardData.departments?.[dept]?.orders?.totalActivities || 0,
          completedActivities: dashboardData.departments?.[dept]?.orders?.completedActivities || 0,
          isLoading: isLoadingData,
          departmentFilter: dept
        }
      },
      // Critical Issues Table
      {
        id: `${dept.toLowerCase()}-critical-issues`,
        title: "Critical Issues",
        subtitle: `${dept} Department`,
        department: dept,
        component: CriticalIssuesTable,
        props: {
          data: getFilteredCriticalIssues(dashboardData.departments?.[dept]),
          isLoading: isLoadingData,
          departmentFilter: dept
        }
      }
    ]))
  ]

  // Get available departments with data in correct order (unused but kept for potential future use)
  // const availableDepartments = ['MTCENG', 'ECDC', 'HETU', 'MMTC', 'PMTC'].filter(dept => 
  //   dashboardData.departments?.[dept] && Object.keys(dashboardData.departments[dept]).length > 0
  // )
  
  // Filter slides based on selected department
  const slides = selectedDepartment ? allSlides.filter(slide => slide.department === selectedDepartment) : []
  
  console.log(`Department ${selectedDepartment} has ${slides.length} slides:`, slides.map(s => s.title))
  

  // Reset current index when department changes
  useEffect(() => {
    setCurrentIndex(0)
    setProgress(0)
  }, [selectedDepartment])

  // Auto-rotation logic - just cycle through slides in current department
  useEffect(() => {
    // If no slides, immediately switch to next department
    if (slides.length === 0 && onDepartmentChange && selectedDepartment) {
      const nextDept = getNextDepartment(selectedDepartment)
      console.log(`No slides for ${selectedDepartment}, switching to ${nextDept}`)
      onDepartmentChange(nextDept)
      return
    }
    
    if (!isPlaying || slides.length === 0) return

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0
        }
        return prev + (100 / (rotateInterval / 50)) // Update every 50ms
      })
    }, 50)

    const slideInterval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = prev + 1
        
        // Special debug for HETU
        if (selectedDepartment === 'HETU') {
          console.log(`🔴 HETU DEBUG: Current: ${prev}, Next: ${nextIndex}, Total slides: ${slides.length}`)
        }
        
        // If we've reached the end of slides, move to next department
        if (nextIndex >= slides.length && selectedDepartment) {
          const nextDept = getNextDepartment(selectedDepartment)
          
          console.log(`🔄 SWITCHING: ${selectedDepartment} → ${nextDept}`)
          
          // Special check for HETU
          if (selectedDepartment === 'HETU') {
            console.log(`🔴 HETU SWITCHING: onDepartmentChange exists:`, !!onDepartmentChange)
            console.log(`🔴 HETU SWITCHING: nextDept !== selectedDepartment:`, nextDept !== selectedDepartment)
          }
          
          if (onDepartmentChange && nextDept !== selectedDepartment) {
            console.log(`✅ Calling onDepartmentChange(${nextDept})`)
            onDepartmentChange(nextDept)
          } else {
            console.log(`❌ NOT calling onDepartmentChange`)
          }
          
          return 0 // Reset to first slide of new department
        }
        
        return nextIndex
      })
      setProgress(0)
    }, rotateInterval)

    return () => {
      clearInterval(progressInterval)
      clearInterval(slideInterval)
    }
  }, [isPlaying, rotateInterval, slides.length, selectedDepartment, onDepartmentChange])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    setProgress(0)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length)
    setProgress(0)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)
    setProgress(0)
  }, [slides.length])

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying)
    setProgress(0)
  }

  if (slides.length === 0) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30 border-2 border-primary/10 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentSlide = slides[currentIndex]
  const ChartComponent = currentSlide.component

  return (
    <div className="relative">


      {/* Main Carousel */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30 border-2 border-primary/10 shadow-lg">
        <CardContent className="p-0">
          <div className="relative">
            {/* Chart Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {currentSlide.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentSlide.subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {currentSlide.department}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentIndex + 1} of {slides.length}
                  </div>
                </div>
              </div>
              
              {/* Chart Data Filters - Inside Carousel */}
              <div className="mt-4 pt-4 border-t border-primary/10">
                {currentSlide.id.includes('safety-incidents') && (
                  <SafetyFilters
                    onFilterChange={setSafetyFilters}
                    currentFilters={safetyFilters}
                    availableYears={availableYears}
                  />
                )}

                {(currentSlide.id.includes('energy-ikes') || currentSlide.id.includes('energy-emission')) && (
                  <EnergyFilters
                    onFilterChange={setEnergyFilters}
                    currentFilters={energyFilters}
                    chartType={currentSlide.id.includes('energy-ikes') ? 'ikes' : 'emission'}
                    availableYears={availableYears}
                  />
                )}

                {currentSlide.id.includes('energy-consumption') && (
                  <ConsumptionFilters
                    onFilterChange={setConsumptionFilters}
                    currentFilters={consumptionFilters}
                    availableYears={availableYears}
                  />
                )}

                {(currentSlide.id.includes('availability') || currentSlide.id.includes('utilization')) && (
                  <ProductivityFilters
                    selectedPeriod={productivityFilters.selectedPeriod}
                    selectedEquipment={productivityFilters.selectedEquipment}
                    availableEquipment={dashboardData.departments?.[currentSlide.department]?.availableEquipment || []}
                    onPeriodChange={(period: "daily" | "weekly" | "monthly" | "yearly") => setProductivityFilters({...productivityFilters, selectedPeriod: period})}
                    onEquipmentChange={(equipment: number[]) => setProductivityFilters({...productivityFilters, selectedEquipment: equipment})}
                    onReset={() => setProductivityFilters({selectedPeriod: "monthly", selectedEquipment: []})}
                    isLoading={isLoadingData}
                  />
                )}

                {currentSlide.id.includes('critical-issues') && (
                  <CriticalIssuesFilters
                    currentFilters={criticalFilters}
                    onFilterChange={setCriticalFilters}
                    totalCount={dashboardData.departments?.[currentSlide.department]?.criticalIssues?.length || 0}
                    filteredCount={dashboardData.departments?.[currentSlide.department]?.criticalIssues?.length || 0}
                  />
                )}

              </div>
            </div>
            
            {/* Chart Content */}
            <div className="p-6 min-h-[500px]">
              {isLoadingData ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading chart data...</p>
                  </div>
                </div>
              ) : (
                <ChartComponent {...currentSlide.props} />
              )}
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost" 
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
              onClick={nextSlide}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Progress Bar */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                <div 
                  className="h-full bg-primary transition-all duration-[50ms] ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Dots and Controls */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {/* Dots */}
        {slides.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-3 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "w-8 bg-primary shadow-md" 
                : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            onClick={() => goToSlide(index)}
          />
        ))}
        
        {/* Controls */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs"
            onClick={toggleAutoplay}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Play
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs"
            onClick={handleRefresh}
            disabled={isLoadingData}
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isLoadingData && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}