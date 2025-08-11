import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EquipmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipmentId')
    const reportDate = searchParams.get('reportDate')
    const departmentId = searchParams.get('departmentId')

    if (!equipmentId || !reportDate || !departmentId) {
      return NextResponse.json(
        { error: 'equipmentId, reportDate, and departmentId are required' },
        { status: 400 }
      )
    }

    const report = await prisma.operationalReport.findUnique({
      where: {
        reportDate_equipmentId: {
          reportDate: new Date(reportDate),
          equipmentId: parseInt(equipmentId)
        }
      },
      include: {
        equipment: {
          include: {
            category: true
          }
        },
        department: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        lastUpdatedBy: {
          select: {
            id: true,
            username: true,
            role: true
          }
        },
        activityDetails: {
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error fetching operational report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      reportDate,
      equipmentId,
      departmentId,
      totalWorking,
      totalStandby,
      totalBreakdown,
      shiftType,
      isComplete,
      activityDetails
    } = body

    // Validate required fields
    if (!reportDate || !equipmentId || !departmentId) {
      return NextResponse.json(
        { error: 'reportDate, equipmentId, and departmentId are required' },
        { status: 400 }
      )
    }

    const userId = parseInt(session.user.id)
    const parsedEquipmentId = parseInt(equipmentId)
    const parsedDepartmentId = parseInt(departmentId)
    const date = new Date(reportDate)

    // Check if report already exists
    const existingReport = await prisma.operationalReport.findUnique({
      where: {
        reportDate_equipmentId: {
          reportDate: date,
          equipmentId: parsedEquipmentId
        }
      }
    })

    let report

    if (existingReport) {
      // Check if user can edit completed report
      if (existingReport.isComplete && session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Cannot edit completed report. Admin approval required.' },
          { status: 403 }
        )
      }

      // Update existing report
      report = await prisma.operationalReport.update({
        where: {
          id: existingReport.id
        },
        data: {
          totalWorking: totalWorking || existingReport.totalWorking,
          totalStandby: totalStandby || existingReport.totalStandby,
          totalBreakdown: totalBreakdown || existingReport.totalBreakdown,
          shiftType: shiftType || existingReport.shiftType,
          isComplete: isComplete !== undefined ? isComplete : existingReport.isComplete,
          lastUpdatedById: userId
        },
        include: {
          equipment: {
            include: {
              category: true
            }
          },
          department: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          lastUpdatedBy: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          activityDetails: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  username: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })
    } else {
      // Create new report
      report = await prisma.operationalReport.create({
        data: {
          reportDate: date,
          equipmentId: parsedEquipmentId,
          departmentId: parsedDepartmentId,
          createdById: userId,
          lastUpdatedById: userId,
          totalWorking: totalWorking || 0,
          totalStandby: totalStandby || 0,
          totalBreakdown: totalBreakdown || 0,
          shiftType: shiftType || '',
          isComplete: isComplete || false
        },
        include: {
          equipment: {
            include: {
              category: true
            }
          },
          department: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          lastUpdatedBy: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          activityDetails: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  username: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })
    }

    // Handle activity details if provided
    if (activityDetails && Array.isArray(activityDetails)) {
      for (const activity of activityDetails) {
        if (activity.startDateTime || activity.endDateTime || activity.description) {
          // Calculate duration if both start and end times are provided
          const startDate = activity.startDateTime ? new Date(activity.startDateTime) : null;
          const endDate = activity.endDateTime ? new Date(activity.endDateTime) : null;
          let duration: number | null = null;
          
          if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const durationMs = endDate.getTime() - startDate.getTime();
            duration = durationMs / (1000 * 60 * 60); // Convert to hours
          }

          await prisma.activityDetail.create({
            data: {
              operationalReportId: report.id,
              equipmentId: parsedEquipmentId,
              startDateTime: startDate,
              endDateTime: endDate,
              duration: duration,
              maintenanceType: activity.maintenanceType || null,
              description: activity.description || null,
              object: activity.object || null,
              cause: activity.cause || null,
              effect: activity.effect || null,
              status: activity.status as EquipmentStatus,
              createdById: userId
            }
          })
        }
      }

      // Refetch report with updated activity details
      report = await prisma.operationalReport.findUnique({
        where: { id: report.id },
        include: {
          equipment: {
            include: {
              category: true
            }
          },
          department: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          lastUpdatedBy: {
            select: {
              id: true,
              username: true,
              role: true
            }
          },
          activityDetails: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  username: true,
                  role: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error creating/updating operational report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
