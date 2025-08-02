import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateDueDate,
  getAllowedPIC,
  hasDataTypeAccess,
} from "@/lib/utils/kta-tta";

interface ExcelRowData {
  noRegister?: string;
  nppPelapor?: string;
  namaPelapor?: string;
  perusahaanBiro?: string;
  tanggal?: string;
  lokasi?: string;
  areaTemuan?: string;
  keterangan?: string;
  fotoUrl?: string;
  kategori?: string;
  sumberTemuan?: string;
  picDepartemen?: string;
  kriteriaKtaTta?: string;
  perusahaanPengelola?: string;
  tindakLanjutLangsung?: string;
  statusTindakLanjut?: string;
  biro?: string;
  _rowNumber?: number;
  _hasAccess?: boolean;
}

// POST /api/kta-tta/bulk-upload - Bulk upload from Excel
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data: excelData, dataType = "KTA_TTA" } = body;

    if (!Array.isArray(excelData) || excelData.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

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

    // Get allowed PIC for current user
    const allowedPIC = getAllowedPIC(
      session.user.role,
      session.user.departmentName || undefined,
      dataType
    );

    // Filter data based on user permissions
    const filteredData = excelData.filter((row: ExcelRowData) => {
      if (allowedPIC.length === 0) return true; // Admin or unrestricted access
      return allowedPIC.includes(row.picDepartemen || "");
    });

    if (filteredData.length === 0) {
      return NextResponse.json(
        {
          error: "No records match your department permissions",
        },
        { status: 403 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];

      try {
        // Use registration number from Excel
        const noRegister = row.noRegister;
        console.log("Using noRegister from Excel:", noRegister); // Debug log

        // Parse date
        let parsedDate = null;
        if (row.tanggal) {
          parsedDate = new Date(row.tanggal);
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date format: ${row.tanggal}`);
          }
        }

        // Calculate due date
        let dueDate = null;
        if (parsedDate && row.kriteriaKtaTta) {
          dueDate = await calculateDueDate(parsedDate, row.kriteriaKtaTta);
        }

        // Validate required fields
        if (
          !row.noRegister ||
          !row.nppPelapor ||
          !row.namaPelapor ||
          !row.picDepartemen
        ) {
          throw new Error(
            "Missing required fields: noRegister, nppPelapor, namaPelapor or picDepartemen"
          );
        }

        // Validate status tindak lanjut
        let statusTindakLanjut = null;
        if (row.statusTindakLanjut) {
          const validStatuses = ["OPEN", "CLOSE"];
          if (validStatuses.includes(row.statusTindakLanjut.toUpperCase())) {
            statusTindakLanjut = row.statusTindakLanjut.toUpperCase();
          }
        }

        // Create record
        await prisma.ktaKpiData.create({
          data: {
            noRegister,
            nppPelapor: row.nppPelapor,
            namaPelapor: row.namaPelapor,
            perusahaanBiro: row.perusahaanBiro,
            tanggal: parsedDate,
            lokasi: row.lokasi,
            areaTemuan: row.areaTemuan,
            keterangan: row.keterangan,
            fotoUrl: row.fotoUrl,
            kategori: row.kategori,
            sumberTemuan: row.sumberTemuan || "Inspeksi", // Default value
            picDepartemen: row.picDepartemen,
            kriteriaKtaTta: row.kriteriaKtaTta,
            perusahaanPengelola: row.perusahaanPengelola,
            tindakLanjutLangsung: row.tindakLanjutLangsung,
            statusTindakLanjut: statusTindakLanjut as "OPEN" | "CLOSE" | null,
            biro: row.biro,
            dueDate,
            dataType: dataType as "KTA_TTA" | "KPI_UTAMA",
            createdById: parseInt(session.user.id),
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Row ${i + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.error(`Error processing row ${i + 1}:`, error);
      }
    }

    return NextResponse.json({
      message: `Upload completed. ${results.success} records created, ${results.failed} failed.`,
      results,
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/kta-tta/bulk-upload - Validate Excel data before upload
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data: excelData, dataType = "KTA_TTA" } = body;

    if (!Array.isArray(excelData)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

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

    // Get allowed PIC for current user
    const allowedPIC = getAllowedPIC(
      session.user.role,
      session.user.departmentName || undefined,
      dataType
    );

    const validationResults = {
      totalRows: excelData.length,
      validRows: 0,
      invalidRows: 0,
      allowedRows: 0,
      restrictedRows: 0,
      errors: [] as string[],
      validatedData: [] as ExcelRowData[],
    };

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i] as ExcelRowData;
      const rowNumber = i + 1;
      let isValid = true;
      const rowErrors: string[] = [];

      // Check required fields
      if (!row.nppPelapor) {
        rowErrors.push("Missing nppPelapor");
        isValid = false;
      }

      if (!row.namaPelapor) {
        rowErrors.push("Missing namaPelapor");
        isValid = false;
      }

      if (!row.picDepartemen) {
        rowErrors.push("Missing picDepartemen");
        isValid = false;
      }

      // Check PIC access permissions
      let hasAccess = true;
      if (
        allowedPIC.length > 0 &&
        !allowedPIC.includes(row.picDepartemen || "")
      ) {
        hasAccess = false;
        validationResults.restrictedRows++;
      } else {
        validationResults.allowedRows++;
      }

      // Validate date format
      if (row.tanggal) {
        const parsedDate = new Date(row.tanggal);
        if (isNaN(parsedDate.getTime())) {
          rowErrors.push(`Invalid date format: ${row.tanggal}`);
          isValid = false;
        }
      }

      // Validate status tindak lanjut
      if (row.statusTindakLanjut) {
        const validStatuses = ["OPEN", "CLOSE"];
        if (!validStatuses.includes(row.statusTindakLanjut.toUpperCase())) {
          rowErrors.push(
            `Invalid status: ${row.statusTindakLanjut}. Must be OPEN or CLOSE`
          );
          isValid = false;
        }
      }

      if (rowErrors.length > 0) {
        validationResults.errors.push(
          `Row ${rowNumber}: ${rowErrors.join(", ")}`
        );
      }

      if (isValid) {
        validationResults.validRows++;
        if (hasAccess) {
          validationResults.validatedData.push({
            ...row,
            _rowNumber: rowNumber,
            _hasAccess: hasAccess,
          });
        }
      } else {
        validationResults.invalidRows++;
      }
    }

    return NextResponse.json(validationResults);
  } catch (error) {
    console.error("Error validating upload data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
