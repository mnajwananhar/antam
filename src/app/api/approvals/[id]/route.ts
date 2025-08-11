import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ApprovalStatus } from "@prisma/client";

const updateApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

// PUT - Update approval request status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and PLANNER can approve/reject
    if (!["ADMIN", "PLANNER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const approvalId = parseInt(resolvedParams.id);
    const body = await request.json();
    const validatedData = updateApprovalSchema.parse(body);

    // Get the approval request
    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        requester: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    if (!approvalRequest) {
      return NextResponse.json(
        { error: "Approval request not found" },
        { status: 404 }
      );
    }

    // Check if user can approve this request
    const canApprove =
      (session.user.role === "ADMIN" || session.user.role === "PLANNER") &&
      approvalRequest.status === "PENDING";

    if (!canApprove) {
      return NextResponse.json(
        { error: "Cannot approve this request" },
        { status: 403 }
      );
    }

    // Update approval request
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: validatedData.status as ApprovalStatus,
        approverId: parseInt(session.user.id),
        approvedAt: new Date(),
      },
      include: {
        requester: {
          select: { id: true, username: true, role: true },
        },
        approver: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    // If approved, apply the changes to actual data
    if (validatedData.status === "APPROVED") {
      try {
        const { ApprovalManager } = await import("@/lib/approval-manager");
        const applyResult = await ApprovalManager.applyApprovedChanges({
          tableName: updatedApproval.tableName,
          recordId: updatedApproval.recordId || undefined,
          newData: updatedApproval.newData as Record<string, unknown>,
          requestType: updatedApproval.requestType,
        });
        
        if (!applyResult.success) {
          console.error("Failed to apply approved changes:", applyResult.error);
          // Could revert the approval status or handle differently
        } else {
          console.log(`Approval ${approvalId} approved and changes applied successfully`);
        }
      } catch (error) {
        console.error("Error applying approved changes:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedApproval,
      message: `Request ${validatedData.status === "APPROVED" ? "disetujui" : "ditolak"}`,
    });
  } catch (error) {
    console.error("Error updating approval request:", error);

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

// DELETE - Delete approval request (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can delete approval requests
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin can delete approval requests" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const approvalId = parseInt(resolvedParams.id);

    await prisma.approvalRequest.delete({
      where: { id: approvalId },
    });

    return NextResponse.json({
      success: true,
      message: "Approval request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting approval request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}