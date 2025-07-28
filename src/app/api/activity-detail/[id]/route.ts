import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EquipmentStatus } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = parseInt(params.id)
    const body = await request.json()
    const {
      startDateTime,
      endDateTime,
      maintenanceType,
      description,
      object,
      cause,
      effect,
      status
    } = body

    const userId = parseInt(session.user.id)

    // Check if activity detail exists
    const existingActivity = await prisma.activityDetail.findUnique({
      where: { id: activityId },
      include: {
        operationalReport: true
      }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity detail not found' },
        { status: 404 }
      )
    }

    // Check if user can edit completed report
    if (existingActivity.operationalReport.isComplete && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot edit activity in completed report. Admin approval required.' },
        { status: 403 }
      )
    }

    const updatedActivity = await prisma.activityDetail.update({
      where: { id: activityId },
      data: {
        startDateTime: startDateTime ? new Date(startDateTime) : null,
        endDateTime: endDateTime ? new Date(endDateTime) : null,
        maintenanceType: maintenanceType || null,
        description: description || null,
        object: object || null,
        cause: cause || null,
        effect: effect || null,
        status: status as EquipmentStatus || existingActivity.status
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
      where: { id: existingActivity.operationalReportId },
      data: { lastUpdatedById: userId }
    })

    return NextResponse.json({ activityDetail: updatedActivity })
  } catch (error) {
    console.error('Error updating activity detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = parseInt(params.id)
    const userId = parseInt(session.user.id)

    // Check if activity detail exists
    const existingActivity = await prisma.activityDetail.findUnique({
      where: { id: activityId },
      include: {
        operationalReport: true
      }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity detail not found' },
        { status: 404 }
      )
    }

    // Check if user can edit completed report
    if (existingActivity.operationalReport.isComplete && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete activity in completed report. Admin approval required.' },
        { status: 403 }
      )
    }

    await prisma.activityDetail.delete({
      where: { id: activityId }
    })

    // Update operational report lastUpdatedBy
    await prisma.operationalReport.update({
      where: { id: existingActivity.operationalReportId },
      data: { lastUpdatedById: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activity detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
