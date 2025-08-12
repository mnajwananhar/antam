import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface SafetyIncidentResponse {
  success: boolean;
  data?: Array<{
    month: number;
    year: number;
    nearmiss: number;
    kecAlat: number;
    kecKecil: number;
    kecRingan: number;
    kecBerat: number;
    fatality: number;
  }>;
  message?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<SafetyIncidentResponse | { error: string }>> {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    
    // Get safety incident data for the specified year
    const safetyData = await prisma.safetyIncident.findMany({
      where: {
        year: year
      },
      orderBy: {
        month: 'asc'
      }
    });

    // If no data exists, create default data for the year
    if (safetyData.length === 0) {
      const defaultData = [];
      for (let month = 1; month <= 12; month++) {
        const incident = await prisma.safetyIncident.create({
          data: {
            month,
            year,
            nearmiss: 0,
            kecAlat: 0,
            kecKecil: 0,
            kecRingan: 0,
            kecBerat: 0,
            fatality: 0
          }
        });
        defaultData.push(incident);
      }
      
      return NextResponse.json({
        success: true,
        data: defaultData
      });
    }

    return NextResponse.json({
      success: true,
      data: safetyData
    });
    
  } catch (error) {
    console.error("Error fetching safety incident data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<SafetyIncidentResponse | { error: string }>> {
  try {
    const session = await auth();
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "PLANNER")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { month, year, nearmiss, kecAlat, kecKecil, kecRingan, kecBerat, fatality } = body;

    // Validate required fields
    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    // Upsert safety incident data
    const safetyIncident = await prisma.safetyIncident.upsert({
      where: {
        month_year: {
          month: parseInt(month),
          year: parseInt(year)
        }
      },
      update: {
        nearmiss: parseInt(nearmiss) || 0,
        kecAlat: parseInt(kecAlat) || 0,
        kecKecil: parseInt(kecKecil) || 0,
        kecRingan: parseInt(kecRingan) || 0,
        kecBerat: parseInt(kecBerat) || 0,
        fatality: parseInt(fatality) || 0
      },
      create: {
        month: parseInt(month),
        year: parseInt(year),
        nearmiss: parseInt(nearmiss) || 0,
        kecAlat: parseInt(kecAlat) || 0,
        kecKecil: parseInt(kecKecil) || 0,
        kecRingan: parseInt(kecRingan) || 0,
        kecBerat: parseInt(kecBerat) || 0,
        fatality: parseInt(fatality) || 0
      }
    });

    return NextResponse.json({
      success: true,
      data: [safetyIncident],
      message: "Safety incident data updated successfully"
    });
    
  } catch (error) {
    console.error("Error updating safety incident data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}