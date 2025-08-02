import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeDefaultKriteria } from "@/lib/utils/kta-tta";

// POST /api/kta-tta/initialize - Initialize default kriteria KTA/TTA
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Initialize default kriteria
    await initializeDefaultKriteria();

    // Get count of kriteria
    const count = await prisma.kriteriaKtaTta.count();

    return NextResponse.json({
      message: "Default kriteria KTA/TTA initialized successfully",
      count,
    });
  } catch (error) {
    console.error("Error initializing kriteria KTA/TTA:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/kta-tta/initialize - Check if kriteria are initialized
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.kriteriaKtaTta.count();
    const kriteria = await prisma.kriteriaKtaTta.findMany({
      where: { isActive: true },
      orderBy: { kriteria: "asc" },
    });

    return NextResponse.json({
      initialized: count > 0,
      count,
      kriteria,
    });
  } catch (error) {
    console.error("Error checking kriteria KTA/TTA:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
