import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiUtils } from "@/lib/utils";
import { createUserSchema } from "@/lib/validations";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const users = await prisma.user.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { username: "asc" }],
    });

    return Response.json(
      apiUtils.createApiResponse(users, "Users retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return apiUtils.createApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return apiUtils.createApiError("Invalid request data", 400);
    }

    const { username, password, role, departmentId } = validation.data;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      return apiUtils.createApiError("Username already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        role,
        departmentId: departmentId || null,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userResponse } = newUser;

    return Response.json(
      apiUtils.createApiResponse(userResponse, "User created successfully"),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return apiUtils.createApiError("Internal server error", 500);
  }
}
