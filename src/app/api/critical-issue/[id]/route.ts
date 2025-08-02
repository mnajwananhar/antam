import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCriticalIssueSchema = z.object({
  issueName: z.string().min(1, "Nama issue wajib diisi").optional(),
  status: z.enum(["WORKING", "STANDBY", "BREAKDOWN"]).optional(),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").optional(),
});

// GET - Ambil critical issue berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const issueId = parseInt(id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: "Invalid critical issue ID" },
        { status: 400 }
      );
    }

    const issue = await prisma.criticalIssue.findUnique({
      where: { id: issueId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: "Critical issue not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      session.user.role === "PLANNER" &&
      session.user.departmentId &&
      issue.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "Access denied to this department" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: issue,
    });
  } catch (error) {
    console.error("Error fetching critical issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update critical issue
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate user role
    if (!["ADMIN", "PLANNER", "INPUTTER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const issueId = parseInt(id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: "Invalid critical issue ID" },
        { status: 400 }
      );
    }

    // Check if issue exists
    const existingIssue = await prisma.criticalIssue.findUnique({
      where: { id: issueId },
    });

    if (!existingIssue) {
      return NextResponse.json(
        { error: "Critical issue not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      session.user.role === "PLANNER" &&
      session.user.departmentId &&
      existingIssue.departmentId !== session.user.departmentId
    ) {
      return NextResponse.json(
        { error: "Access denied to this department" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateCriticalIssueSchema.parse(body);

    // Update critical issue
    const updatedIssue = await prisma.criticalIssue.update({
      where: { id: issueId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: "Critical issue berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating critical issue:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete critical issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can delete
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin can delete critical issues" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const issueId = parseInt(id);

    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: "Invalid critical issue ID" },
        { status: 400 }
      );
    }

    // Check if issue exists
    const existingIssue = await prisma.criticalIssue.findUnique({
      where: { id: issueId },
    });

    if (!existingIssue) {
      return NextResponse.json(
        { error: "Critical issue not found" },
        { status: 404 }
      );
    }

    // Delete critical issue
    await prisma.criticalIssue.delete({
      where: { id: issueId },
    });

    return NextResponse.json({
      success: true,
      message: "Critical issue berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting critical issue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
