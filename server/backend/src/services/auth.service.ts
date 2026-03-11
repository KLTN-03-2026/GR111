import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import type { RegisterInput, LoginInput } from "@/validations/auth.schema";

const SALT_ROUNDS = 12;

// ============================================================
// AUTH SERVICE
// ============================================================

/**
 * Đăng ký tài khoản mới
 */
export async function registerUser(input: RegisterInput) {
  // Kiểm tra email đã tồn tại chưa
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  // Kiểm tra SĐT đã tồn tại chưa
  if (input.phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: input.phone },
    });
    if (existingPhone) throw new Error("PHONE_EXISTS");
  }

  // Hash mật khẩu
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Tạo user và profile trong 1 transaction
  const user = await prisma.user.create({
    data: {
      email: input.email,
      phone: input.phone,
      fullName: input.fullName,
      passwordHash,
      profile: { create: {} }, // Tạo profile rỗng đi kèm
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Đăng nhập và trả về token
 */
export async function loginUser(input: LoginInput) {
  // Tìm user theo email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      role: true,
      isActive: true,
      avatarUrl: true,
    },
  });

  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new Error("ACCOUNT_DISABLED");
  }

  // Kiểm tra mật khẩu
  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Cập nhật lastLoginAt
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Tạo JWT token
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
}

/**
 * Lấy thông tin user hiện tại (profile)
 */
export async function getMyProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      profile: {
        select: {
          address: true,
          dateOfBirth: true,
          gender: true,
          bio: true,
        },
      },
    },
  });
}
