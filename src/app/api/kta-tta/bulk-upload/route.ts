import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateDueDate,
  getAllowedPIC,
  hasDataTypeAccess,
  cleanKriteriaKtaTta,
  calculateUpdateStatus,
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
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];

      try {
        // Parse date first
        let parsedDate = null;
        if (row.tanggal) {
          parsedDate = new Date(row.tanggal);
          if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date format: ${row.tanggal}`);
          }
        }

        // Generate registration number if not provided
        let noRegister = row.noRegister;
        if (!noRegister || noRegister.trim() === "") {
          // Generate format: DEPT-YYYYMMDD-XXX
          const date = parsedDate || new Date();
          const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
          const dept = row.picDepartemen || "UNK";
          
          // Get count of records for this department and date to generate sequence
          const existingCount = await prisma.ktaKpiData.count({
            where: {
              picDepartemen: dept,
              tanggal: {
                gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
              },
              dataType: dataType as "KTA_TTA" | "KPI_UTAMA"
            }
          });
          
          const sequence = (existingCount + 1).toString().padStart(3, "0");
          noRegister = `${dept}-${dateStr}-${sequence}`;
          console.log("Generated noRegister:", noRegister);
        } else {
          console.log("Using noRegister from Excel:", noRegister);
        }

        // Clean kriteria KTA/TTA jika ada nomor urut
        let cleanedKriteriaKtaTta = row.kriteriaKtaTta;
        if (cleanedKriteriaKtaTta) {
          cleanedKriteriaKtaTta = cleanKriteriaKtaTta(cleanedKriteriaKtaTta);
        }
        
        // Calculate due date
        let dueDate = null;
        if (parsedDate && cleanedKriteriaKtaTta) {
          dueDate = await calculateDueDate(parsedDate, cleanedKriteriaKtaTta);
        }
        
        // Calculate update status
        let updateStatus = "Proses";
        if (row.statusTindakLanjut && dueDate) {
          updateStatus = calculateUpdateStatus(dueDate, row.statusTindakLanjut);
        } else if (row.statusTindakLanjut === "CLOSE") {
          updateStatus = "Close";
        }

        // Validate required fields (noRegister will be auto-generated if not provided)
        if (
          !row.nppPelapor ||
          !row.namaPelapor ||
          !row.picDepartemen
        ) {
          throw new Error(
            "Missing required fields: nppPelapor, namaPelapor or picDepartemen"
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

        // Create record - use upsert to handle duplicates
        const result = await prisma.ktaKpiData.upsert({
          where: { noRegister },
          update: {
            // Update existing record with new data
            nppPelapor: row.nppPelapor,
            namaPelapor: row.namaPelapor,
            perusahaanBiro: row.perusahaanBiro,
            tanggal: parsedDate,
            lokasi: row.lokasi,
            areaTemuan: row.areaTemuan,
            keterangan: row.keterangan,
            fotoUrl: row.fotoUrl,
            kategori: row.kategori,
            sumberTemuan: row.sumberTemuan || "Inspeksi",
            picDepartemen: row.picDepartemen,
            kriteriaKtaTta: cleanedKriteriaKtaTta,
            perusahaanPengelola: row.perusahaanPengelola,
            tindakLanjutLangsung: row.tindakLanjutLangsung,
            statusTindakLanjut: statusTindakLanjut as "OPEN" | "CLOSE" | null,
            biro: row.biro,
            dueDate,
            updateStatus,
            updatedAt: new Date(),
          },
          create: {
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
            kriteriaKtaTta: cleanedKriteriaKtaTta, // Use cleaned kriteria
            perusahaanPengelola: row.perusahaanPengelola,
            tindakLanjutLangsung: row.tindakLanjutLangsung,
            statusTindakLanjut: statusTindakLanjut as "OPEN" | "CLOSE" | null,
            biro: row.biro,
            dueDate,
            updateStatus, // Use calculated update status
            dataType: dataType as "KTA_TTA" | "KPI_UTAMA",
            createdById: parseInt(session.user.id),
          },
        });

        // Check if it was created or updated by comparing timestamps
        const wasCreated = result.createdAt.getTime() === result.updatedAt.getTime();
        if (wasCreated) {
          results.created++;
        } else {
          results.updated++;
        }
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
      message: `Upload completed. ${results.created} created, ${results.updated} updated, ${results.failed} failed.`,
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

      // Check required fields (noRegister will be auto-generated)
      if (!row.nppPelapor || row.nppPelapor.toString().trim() === "") {
        rowErrors.push("nppPelapor wajib diisi");
        isValid = false;
      }

      if (!row.namaPelapor || row.namaPelapor.toString().trim() === "") {
        rowErrors.push("namaPelapor wajib diisi");
        isValid = false;
      }

      if (!row.picDepartemen || row.picDepartemen.toString().trim() === "") {
        rowErrors.push("picDepartemen wajib diisi");
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
