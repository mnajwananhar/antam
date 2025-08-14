import { PrismaClient, EquipmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedHistoricalData() {
  console.log('🌱 Seeding Historical Data...');

  // Get required references
  const departments = await prisma.department.findMany();
  const equipment = await prisma.equipment.findMany();
  const users = await prisma.user.findMany();

  const mmtcDept = departments.find((d) => d.code === 'MMTC')!;
  const pmtcDept = departments.find((d) => d.code === 'PMTC')!;
  
  const inputterUser = users.find((u) => u.username === 'inputter_shift1')!;
  const inputterShift2 = users.find((u) => u.username === 'inputter_shift2')!;
  const inputterShift3 = users.find((u) => u.username === 'inputter_shift3')!;

  // Get ALL equipment for comprehensive data generation
  const allActiveEquipment = equipment.filter(eq => eq.isActive);;

  // Create historical operational reports for last 30 days
  console.log('📊 Creating historical operational reports...');
  
  const today = new Date();
  const historicalReports = [];

  // Helper function to get equipment department
  const getEquipmentDepartment = async (equipmentId: number) => {
    const equipmentDept = await prisma.equipmentDepartment.findFirst({
      where: { equipmentId, isActive: true },
      include: { department: true }
    });
    return equipmentDept?.department || pmtcDept; // Default to PMTC if not found
  };

  // Helper function to generate operational patterns based on equipment type
  const getOperationalPattern = (equipmentCode: string) => {
    if (equipmentCode.includes('Ball Mill')) {
      return { baseWorking: 20, variability: 4, breakdownChance: 0.2, operatesWeekend: true };
    } else if (equipmentCode.includes('Crushing')) {
      return { baseWorking: 22, variability: 2, breakdownChance: 0.15, operatesWeekend: true };
    } else if (equipmentCode.includes('Backfill')) {
      return { baseWorking: 16, variability: 6, breakdownChance: 0.25, operatesWeekend: false };
    } else if (equipmentCode.includes('LH')) { // LHD
      return { baseWorking: 16, variability: 6, breakdownChance: 0.3, operatesWeekend: true };
    } else if (equipmentCode.includes('DR')) { // Jumbo Drill
      return { baseWorking: 12, variability: 4, breakdownChance: 0.25, operatesWeekend: false };
    } else if (equipmentCode.includes('MT')) { // Mine Truck
      return { baseWorking: 18, variability: 4, breakdownChance: 0.3, operatesWeekend: true };
    } else if (equipmentCode.includes('SC')) { // Shortcrete
      return { baseWorking: 8, variability: 4, breakdownChance: 0.35, operatesWeekend: false };
    } else if (equipmentCode.includes('MIX')) { // Mixer Truck
      return { baseWorking: 10, variability: 6, breakdownChance: 0.4, operatesWeekend: false };
    } else if (equipmentCode.includes('TL')) { // Trolley Locomotive
      return { baseWorking: 14, variability: 4, breakdownChance: 0.25, operatesWeekend: true };
    }
    return { baseWorking: 16, variability: 4, breakdownChance: 0.25, operatesWeekend: true }; // Default
  };

  // Generate data untuk 3 tahun terakhir untuk SEMUA equipment (untuk visualisasi yearly yang lebih baik)
  console.log(`Generating operational data for ${allActiveEquipment.length} equipment over 3 years...`);
  
  const totalDays = 365 * 3; // 3 tahun
  for (let daysBack = 2; daysBack <= totalDays; daysBack++) {
    const reportDate = new Date(today);
    reportDate.setDate(reportDate.getDate() - daysBack);
    const isWeekend = reportDate.getDay() === 0 || reportDate.getDay() === 6;

    // Generate data for ALL equipment
    for (const eq of allActiveEquipment) {
      const pattern = getOperationalPattern(eq.code);
      
      // Skip if equipment doesn't operate on weekends and it's weekend
      if (isWeekend && !pattern.operatesWeekend && Math.random() > 0.3) {
        continue;
      }

      // Get department for this equipment
      const equipmentDept = await getEquipmentDepartment(eq.id);

      const workingHours = Math.max(0, pattern.baseWorking + Math.floor(Math.random() * pattern.variability) - Math.floor(pattern.variability/2));
      const breakdownHours = Math.random() < pattern.breakdownChance ? Math.floor(Math.random() * 4) : 0;
      const standbyHours = Math.max(0, 24 - workingHours - breakdownHours);

      const notes = breakdownHours > 2 ? 
        `Major maintenance - ${eq.code}` : 
        breakdownHours > 0 ? 
        `Minor maintenance - ${eq.code}` : 
        `Normal operation - ${eq.code}`;

      historicalReports.push({
        reportDate: reportDate,
        equipmentId: eq.id,
        departmentId: equipmentDept.id,
        createdById: [inputterUser.id, inputterShift2.id, inputterShift3.id][Math.floor(Math.random() * 3)],
        totalWorking: workingHours,
        totalStandby: standbyHours,
        totalBreakdown: breakdownHours,
        shiftType: ['Shift 1', 'Shift 2', 'Shift 3'][Math.floor(Math.random() * 3)],
        isComplete: true,
        notes: notes,
      });
    }
  }

  // Insert historical reports in batches to avoid timeout
  console.log(`Creating ${historicalReports.length} historical operational reports...`);
  
  const batchSize = 50;
  for (let i = 0; i < historicalReports.length; i += batchSize) {
    const batch = historicalReports.slice(i, i + batchSize);
    
    await prisma.operationalReport.createMany({
      data: batch,
      skipDuplicates: true,
    });
    
    console.log(`✅ Processed batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(historicalReports.length / batchSize)}`);
  }

  console.log(`✅ Created historical operational reports`);

  // Create some historical equipment status changes
  console.log('🔄 Creating historical equipment status changes...');
  
  const statusChanges = [];
  const equipmentList = allActiveEquipment;
  
  for (let daysBack = 3; daysBack <= 15; daysBack += 3) {
    const changeDate = new Date(today);
    changeDate.setDate(changeDate.getDate() - daysBack);
    changeDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

    // Random equipment status change
    const randomEquipment = equipmentList[Math.floor(Math.random() * equipmentList.length)];
    const statuses = [EquipmentStatus.WORKING, EquipmentStatus.STANDBY, EquipmentStatus.BREAKDOWN];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomUser = [inputterUser.id, inputterShift2.id, inputterShift3.id][Math.floor(Math.random() * 3)];

    statusChanges.push({
      equipmentId: randomEquipment.id,
      status: randomStatus,
      changedAt: changeDate,
      changedById: randomUser,
      notes: randomStatus === EquipmentStatus.BREAKDOWN ? 'Equipment failure reported' :
             randomStatus === EquipmentStatus.STANDBY ? 'Scheduled maintenance' :
             'Back to normal operation',
    });
  }

  await Promise.all(
    statusChanges.map((change) =>
      prisma.equipmentStatusHistory.create({
        data: change,
      })
    )
  );

  console.log(`✅ Created ${statusChanges.length} historical equipment status changes`);
}

if (require.main === module) {
  seedHistoricalData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
