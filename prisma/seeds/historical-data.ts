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

  const ballMill1 = equipment.find((eq) => eq.code === 'Ball Mill 1')!;
  const ballMill2 = equipment.find((eq) => eq.code === 'Ball Mill 2')!;
  const lhd003 = equipment.find((eq) => eq.code === '08LH003')!;
  const lhd006 = equipment.find((eq) => eq.code === '08LH006')!;
  const jumboDrill001 = equipment.find((eq) => eq.code === '08DR001')!;

  // Create historical operational reports for last 30 days
  console.log('📊 Creating historical operational reports...');
  
  const today = new Date();
  const historicalReports = [];

  // Generate data for last 30 days
  for (let daysBack = 2; daysBack <= 30; daysBack++) {
    const reportDate = new Date(today);
    reportDate.setDate(reportDate.getDate() - daysBack);

    // Skip weekends for some equipment (simulate maintenance schedule)
    const isWeekend = reportDate.getDay() === 0 || reportDate.getDay() === 6;

    // Ball Mill 1 - mostly operational
    if (!isWeekend || daysBack % 7 === 0) {
      const workingHours = 20 + Math.floor(Math.random() * 4);
      const breakdownHours = Math.floor(Math.random() * 3);
      const standbyHours = 24 - workingHours - breakdownHours;

      historicalReports.push({
        reportDate: reportDate,
        equipmentId: ballMill1.id,
        departmentId: pmtcDept.id,
        createdById: [inputterUser.id, inputterShift2.id, inputterShift3.id][Math.floor(Math.random() * 3)],
        totalWorking: workingHours,
        totalStandby: standbyHours,
        totalBreakdown: breakdownHours,
        shiftType: ['Shift 1', 'Shift 2', 'Shift 3'][Math.floor(Math.random() * 3)],
        isComplete: true,
        notes: breakdownHours > 0 ? 'Ada minor maintenance' : 'Operasi normal',
      });
    }

    // Ball Mill 2 - similar pattern but different values
    if (!isWeekend || daysBack % 5 === 0) {
      const workingHours = 18 + Math.floor(Math.random() * 5);
      const breakdownHours = Math.floor(Math.random() * 4);
      const standbyHours = 24 - workingHours - breakdownHours;

      historicalReports.push({
        reportDate: reportDate,
        equipmentId: ballMill2.id,
        departmentId: pmtcDept.id,
        createdById: [inputterUser.id, inputterShift2.id, inputterShift3.id][Math.floor(Math.random() * 3)],
        totalWorking: workingHours,
        totalStandby: standbyHours,
        totalBreakdown: breakdownHours,
        shiftType: ['Shift 1', 'Shift 2', 'Shift 3'][Math.floor(Math.random() * 3)],
        isComplete: true,
        notes: breakdownHours > 2 ? 'Maintenance terjadwal' : 'Operasi normal',
      });
    }

    // LHD 003 - mobile equipment, more variable
    const lhdWorkingHours = 14 + Math.floor(Math.random() * 8);
    const lhdBreakdownHours = Math.floor(Math.random() * 5);
    const lhdStandbyHours = 24 - lhdWorkingHours - lhdBreakdownHours;

    historicalReports.push({
      reportDate: reportDate,
      equipmentId: lhd003.id,
      departmentId: mmtcDept.id,
      createdById: [inputterUser.id, inputterShift2.id, inputterShift3.id][Math.floor(Math.random() * 3)],
      totalWorking: lhdWorkingHours,
      totalStandby: lhdStandbyHours,
      totalBreakdown: lhdBreakdownHours,
      shiftType: ['Shift 1', 'Shift 2', 'Shift 3'][Math.floor(Math.random() * 3)],
      isComplete: true,
      notes: lhdBreakdownHours > 3 ? 'Trouble hydraulic system' : 'Loading hauling normal',
    });

    // LHD 006 - Different pattern
    if (daysBack < 25) { // Simulate this equipment being newer/better maintained
      const lhd6WorkingHours = 16 + Math.floor(Math.random() * 6);
      const lhd6BreakdownHours = Math.floor(Math.random() * 3);
      const lhd6StandbyHours = 24 - lhd6WorkingHours - lhd6BreakdownHours;

      historicalReports.push({
        reportDate: reportDate,
        equipmentId: lhd006.id,
        departmentId: mmtcDept.id,
        createdById: [inputterUser.id, inputterShift2.id, inputterShift3.id][Math.floor(Math.random() * 3)],
        totalWorking: lhd6WorkingHours,
        totalStandby: lhd6StandbyHours,
        totalBreakdown: lhd6BreakdownHours,
        shiftType: ['Shift 1', 'Shift 2', 'Shift 3'][Math.floor(Math.random() * 3)],
        isComplete: true,
        notes: lhd6BreakdownHours > 1 ? 'Minor adjustment' : 'Operasi optimal',
      });
    }

    // Jumbo Drill - weekdays only operation
    if (!isWeekend) {
      const drillWorkingHours = 12 + Math.floor(Math.random() * 6);
      const drillBreakdownHours = Math.floor(Math.random() * 2);
      const drillStandbyHours = 24 - drillWorkingHours - drillBreakdownHours;

      historicalReports.push({
        reportDate: reportDate,
        equipmentId: jumboDrill001.id,
        departmentId: mmtcDept.id,
        createdById: [inputterUser.id, inputterShift2.id][Math.floor(Math.random() * 2)], // Only day shifts
        totalWorking: drillWorkingHours,
        totalStandby: drillStandbyHours,
        totalBreakdown: drillBreakdownHours,
        shiftType: ['Shift 1', 'Shift 2'][Math.floor(Math.random() * 2)],
        isComplete: true,
        notes: drillBreakdownHours > 0 ? 'Bit change required' : 'Drilling progress normal',
      });
    }
  }

  // Insert historical reports in batches to avoid timeout
  console.log(`Creating ${historicalReports.length} historical operational reports...`);
  
  const batchSize = 50;
  for (let i = 0; i < historicalReports.length; i += batchSize) {
    const batch = historicalReports.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (reportData) => {
        const existingReport = await prisma.operationalReport.findUnique({
          where: { 
            reportDate_equipmentId: {
              reportDate: reportData.reportDate,
              equipmentId: reportData.equipmentId
            }
          }
        });

        if (!existingReport) {
          return prisma.operationalReport.create({
            data: reportData,
          });
        }
        return null;
      })
    );
    
    console.log(`✅ Processed batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(historicalReports.length / batchSize)}`);
  }

  console.log(`✅ Created historical operational reports`);

  // Create some historical equipment status changes
  console.log('🔄 Creating historical equipment status changes...');
  
  const statusChanges = [];
  const equipmentList = [ballMill1, ballMill2, lhd003, lhd006, jumboDrill001];
  
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
