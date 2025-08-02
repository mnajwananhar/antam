import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateUpdateStatus,
  getAllowedPIC,
  hasDataTypeAccess,
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

    // Build where clause based on user permissions
    const whereClause: Record<string, unknown> = {
      dataType: dataType,
    };

    // Apply PIC filtering based on user role
    const allowedPIC = getAllowedPIC(
      session.user.role,
      session.user.departmentName || undefined,
      dataType
    );
    if (allowedPIC.length > 0) {
      whereClause.picDepartemen = {
        in: allowedPIC,
      };
    }

    // Apply additional filters
    if (picFilter) {
      whereClause.picDepartemen = picFilter;
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

    const data = await prisma.ktaKpiData.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            username: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate update status for each record
    const dataWithUpdateStatus = data.map((record) => ({
      ...record,
      updateStatus: calculateUpdateStatus(
        record.dueDate,
        record.statusTindakLanjut || ""
      ),
    }));

    return NextResponse.json({ data: dataWithUpdateStatus });
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
