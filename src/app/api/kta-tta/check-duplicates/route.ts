import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
}

interface ExistingRecord {
  id: number;
  noRegister: string;
  tanggal: Date | null;
  keterangan: string | null;
  picDepartemen: string | null;
  namaPelapor: string | null;
  createdAt: Date;
}

interface DuplicationCheck {
  rowIndex: number;
  isDuplicate: boolean;
  existingRecord?: ExistingRecord;
  duplicateReason?: string;
}

// POST /api/kta-tta/check-duplicates - Check for existing data in database
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data: excelData } = body;

    if (!Array.isArray(excelData)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    const duplicateChecks: DuplicationCheck[] = [];

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i] as ExcelRowData;
      
      try {
        // Parse tanggal
        let parsedDate = null;
        if (row.tanggal) {
          parsedDate = new Date(row.tanggal);
          if (isNaN(parsedDate.getTime())) {
            parsedDate = null;
          }
        }

        // Check for existing records based on key fields
        // We'll check for duplicates based on multiple criteria:
        // 1. Same noRegister (exact duplicate)
        // 2. Same combination of key fields that would indicate the same incident
        
        let existingRecord = null;
        let duplicateReason = "";

        // Check 1: Exact noRegister match
        if (row.noRegister && row.noRegister.trim() !== "") {
          existingRecord = await prisma.ktaKpiData.findFirst({
            where: {
              noRegister: row.noRegister.trim()
            },
            select: {
              id: true,
              noRegister: true,
              tanggal: true,
              keterangan: true,
              picDepartemen: true,
              namaPelapor: true,
              createdAt: true
            }
          });
          
          if (existingRecord) {
            duplicateReason = "Nomor register sudah ada di database";
          }
        }

        // Check 2: Same incident (same reporter, department, date, and similar description)
        if (!existingRecord && row.nppPelapor && row.picDepartemen && parsedDate) {
          existingRecord = await prisma.ktaKpiData.findFirst({
            where: {
              nppPelapor: row.nppPelapor,
              picDepartemen: row.picDepartemen,
              tanggal: parsedDate,
              // Optional: check for similar keterangan if provided
              ...(row.keterangan && {
                keterangan: {
                  contains: row.keterangan.substring(0, 50), // Check first 50 chars
                  mode: 'insensitive'
                }
              })
            },
            select: {
              id: true,
              noRegister: true,
              tanggal: true,
              keterangan: true,
              picDepartemen: true,
              namaPelapor: true,
              createdAt: true
            }
          });

          if (existingRecord) {
            duplicateReason = "Data serupa sudah ada (pelapor, departemen, tanggal, dan keterangan sama)";
          }
        }

        duplicateChecks.push({
          rowIndex: i,
          isDuplicate: !!existingRecord,
          existingRecord: existingRecord || undefined,
          duplicateReason: duplicateReason || undefined
        });

      } catch (error) {
        console.error(`Error checking row ${i + 1}:`, error);
        duplicateChecks.push({
          rowIndex: i,
          isDuplicate: false,
          duplicateReason: `Error saat mengecek: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const totalDuplicates = duplicateChecks.filter(check => check.isDuplicate).length;
    const totalUnique = duplicateChecks.filter(check => !check.isDuplicate).length;

    return NextResponse.json({
      message: `Pengecekan selesai. ${totalUnique} data baru, ${totalDuplicates} data duplikat`,
      results: {
        totalChecked: excelData.length,
        totalUnique,
        totalDuplicates,
        checks: duplicateChecks
      }
    });

  } catch (error) {
    console.error("Error checking duplicates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}