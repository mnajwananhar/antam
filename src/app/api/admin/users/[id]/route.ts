import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const updateUserSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter"),
  role: z.nativeEnum(UserRole),
  departmentId: z.number().optional(),
  isActive: z.boolean(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Password minimal 6 karakter jika diisi",
    }),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { username, role, departmentId, isActive, password } =
      validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Don't allow admin to edit their own role or status
    if (existingUser.id.toString() === session.user.id) {
      return NextResponse.json(
        { error: "Tidak dapat mengubah data sendiri" },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    if (username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: "Username sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // Check if department exists (for non-admin roles)
    if (role !== UserRole.ADMIN && departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });

      if (!department) {
        return NextResponse.json(
          { error: "Departemen tidak ditemukan" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      username: string;
      role: UserRole;
      departmentId: number | null;
      isActive: boolean;
      updatedAt: Date;
      password?: string;
    } = {
      username,
      role,
      departmentId: role === UserRole.ADMIN ? null : departmentId || null,
      isActive,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        department: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        departmentId: updatedUser.departmentId,
        department: updatedUser.department,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt,
      },
      message: "User berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem" },
      { status: 500 }
    );
  }
}
