import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAllowedPIC,
  hasDataTypeAccess,
  calculateUpdateStatus,
} from "@/lib/utils/kta-tta";
import * as XLSX from "xlsx";

// GET /api/kta-tta/export - Export KTA/TTA or KPI Utama data to Excel
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
    const whereClause: {
      dataType: "KTA_TTA" | "KPI_UTAMA";
      picDepartemen?: { in: string[] };
    } = {
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

    // Fetch data with creator information
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

    // Prepare data for Excel export
    const exportData = data.map((record) => {
      const updateStatus = calculateUpdateStatus(
        record.dueDate,
        record.statusTindakLanjut || null
      );

      return {
        "No Register": record.noRegister,
        "Nama Pelapor": record.namaPelapor || "",
        "Perusahaan/Biro": record.perusahaanBiro || "",
        Tanggal: record.tanggal ? formatDateForExcel(record.tanggal) : "",
        Lokasi: record.lokasi || "",
        "Area Temuan": record.areaTemuan || "",
        Kategori: record.kategori || "",
        "PIC Departemen": record.picDepartemen || "",
        "Kriteria KTA/TTA": record.kriteriaKtaTta || "",
        "Sumber Temuan": record.sumberTemuan || "",
        "Status Tindak Lanjut": record.statusTindakLanjut || "",
        "Tindak Lanjut Langsung": record.tindakLanjutLangsung || "",
        "Due Date": record.dueDate ? formatDateForExcel(record.dueDate) : "",
        "Update Status": updateStatus,
        Keterangan: record.keterangan || "",
        "Foto URL": record.fotoUrl || "",
        "Perusahaan Pengelola": record.perusahaanPengelola || "",
        Biro: record.biro || "",
        "Dibuat Oleh": record.createdBy?.username || "",
        "Role Pembuat": record.createdBy?.role || "",
        "Tanggal Dibuat": formatDateTimeForExcel(record.createdAt),
        "Terakhir Diupdate": record.updatedAt
          ? formatDateTimeForExcel(record.updatedAt)
          : "",
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // No Register
      { wch: 25 }, // Nama Pelapor
      { wch: 20 }, // Perusahaan/Biro
      { wch: 12 }, // Tanggal
      { wch: 20 }, // Lokasi
      { wch: 20 }, // Area Temuan
      { wch: 18 }, // Kategori
      { wch: 15 }, // PIC Departemen
      { wch: 25 }, // Kriteria KTA/TTA
      { wch: 15 }, // Sumber Temuan
      { wch: 18 }, // Status Tindak Lanjut
      { wch: 30 }, // Tindak Lanjut Langsung
      { wch: 12 }, // Due Date
      { wch: 15 }, // Update Status
      { wch: 30 }, // Keterangan
      { wch: 30 }, // Foto URL
      { wch: 20 }, // Perusahaan Pengelola
      { wch: 15 }, // Biro
      { wch: 15 }, // Dibuat Oleh
      { wch: 12 }, // Role Pembuat
      { wch: 18 }, // Tanggal Dibuat
      { wch: 18 }, // Terakhir Diupdate
    ];

    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    const sheetName = dataType === "KTA_TTA" ? "KTA_TTA" : "KPI_Utama";
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `export_${dataType.toLowerCase()}_${timestamp}.xlsx`;

    // Return file as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting KTA/TTA data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Format date for Excel display (YYYY-MM-DD)
 */
function formatDateForExcel(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format datetime for Excel display (YYYY-MM-DD HH:MM:SS)
 */
function formatDateTimeForExcel(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split("T")[0];
  const timePart = isoString.split("T")[1].split(".")[0];
  return `${datePart} ${timePart}`;
}
