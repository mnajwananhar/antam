import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EquipmentStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      operationalReportId,
      equipmentId,
      startDateTime,
      endDateTime,
      maintenanceType,
      description,
      object,
      cause,
      effect,
      status
    } = body

    // Validate required fields
    if (!operationalReportId || !equipmentId || !status) {
      return NextResponse.json(
        { error: 'operationalReportId, equipmentId, and status are required' },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id)

    // Check if operational report exists and user can edit it
    const operationalReport = await prisma.operationalReport.findUnique({
      where: { id: parseInt(operationalReportId) }
    })

    if (!operationalReport) {
      return NextResponse.json(
        { error: 'Operational report not found' },
        { status: 404 }
      )
    }

    // Check if user can edit completed report
    if (operationalReport.isComplete && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot edit activity in completed report. Admin approval required.' },
        { status: 403 }
      )
    }

    // Calculate duration if both start and end times are provided
    const startDate = startDateTime ? new Date(startDateTime) : null;
    const endDate = endDateTime ? new Date(endDateTime) : null;
    let duration: number | null = null;
    
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const durationMs = endDate.getTime() - startDate.getTime();
      duration = durationMs / (1000 * 60 * 60); // Convert to hours
    }

    const activityDetail = await prisma.activityDetail.create({
      data: {
        operationalReportId: parseInt(operationalReportId),
        equipmentId: parseInt(equipmentId),
        startDateTime: startDate,
        endDateTime: endDate,
        duration: duration,
        maintenanceType: maintenanceType || null,
        description: description || null,
        object: object || null,
        cause: cause || null,
        effect: effect || null,
        status: status as EquipmentStatus,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        equipment: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    // Update operational report lastUpdatedBy
    await prisma.operationalReport.update({
      where: { id: parseInt(operationalReportId) },
      data: { lastUpdatedById: userId }
    })

    return NextResponse.json({ activityDetail })
  } catch (error) {
    console.error('Error creating activity detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
