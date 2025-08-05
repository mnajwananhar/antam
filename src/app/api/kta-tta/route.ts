import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateUpdateStatus,
  getAllowedPIC,
  hasDataTypeAccess,
  buildPICWhereClause,
} from "@/lib/utils/kta-tta";

// GET /api/kta-tta - Fetch KTA/TTA data with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataType = (searchParams.get("dataType") || "KTA_TTA") as
      | "KTA_TTA"
      | "KPI_UTAMA";
    const picFilter = searchParams.get("pic");
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "1000"); // Default limit for scalability
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if user has access to this data type
    if (
      !hasDataTypeAccess(
        session.user.role,
        session.user.departmentName || undefined,
        dataType
      )
    ) {
      return NextResponse.json(
        { error: "Access denied for this data type" },
        { status: 403 }
      );
    }

    // Build optimized where clause for high scalability
    const whereClause = buildPICWhereClause(
      session.user.role,
      session.user.departmentName || undefined,
      dataType
    );

    // Apply additional filters (respecting PIC filtering)
    if (picFilter && whereClause.picDepartemen !== undefined) {
      // Only apply picFilter if user has access to that PIC
      const allowedPICs = getAllowedPIC(
        session.user.role,
        session.user.departmentName || undefined,
        dataType
      );
      
      if (allowedPICs.length === 0 || allowedPICs.includes(picFilter)) {
        whereClause.picDepartemen = picFilter;
      }
    }

    if (statusFilter) {
      whereClause.statusTindakLanjut = statusFilter;
    }

    if (search) {
      whereClause.OR = [
        { noRegister: { contains: search, mode: "insensitive" } },
        { nppPelapor: { contains: search, mode: "insensitive" } },
        { namaPelapor: { contains: search, mode: "insensitive" } },
        { keterangan: { contains: search, mode: "insensitive" } },
      ];
    }

    // Optimized query with pagination for high scalability
    const data = await prisma.ktaKpiData.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" } // Secondary sort for consistent pagination
      ],
      take: Math.min(limit, 5000), // Cap at 5000 for performance
      skip: offset,
    });

    // Get total count for pagination (only if needed)
    const totalCount = offset === 0 && data.length < limit 
      ? data.length 
      : await prisma.ktaKpiData.count({ where: whereClause });

    // Calculate update status for each record
    const dataWithUpdateStatus = data.map((record) => ({
      ...record,
      updateStatus: calculateUpdateStatus(
        record.dueDate,
        record.statusTindakLanjut || null
      ),
    }));

    return NextResponse.json({ 
      data: dataWithUpdateStatus,
      meta: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > (offset + data.length)
      }
    });
  } catch (error) {
    console.error("Error fetching KTA/TTA data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST method disabled - KTA/TTA and KPI Utama only support Excel upload
// Use /api/kta-tta/bulk-upload for Excel-based data entry
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Manual input disabled. KTA/TTA and KPI Utama only support Excel upload via bulk-upload endpoint.",
    },
    { status: 405 }
  );
}

// PUT method disabled - KTA/TTA and KPI Utama only support Excel upload
// Individual record updates not allowed, use bulk-upload to replace data
export async function PUT() {
  return NextResponse.json(
    {
      error:
        "Individual record updates disabled. KTA/TTA and KPI Utama only support Excel upload via bulk-upload endpoint.",
    },
    { status: 405 }
  );
}

// DELETE /api/kta-tta - Delete KTA/TTA record (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.ktaKpiData.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting KTA/TTA record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
