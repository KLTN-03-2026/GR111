import { prisma } from "@/infra/db/prisma";
import { PostType, Prisma } from "@/generated/prisma";
import { notifyPlayersAboutOwnerPost } from "@/modules/user/notification.service";

export const POST_TITLE_MAX = 200;
export const POST_CONTENT_MAX = 20000;

function assertLengths(title: string, content: string) {
  const t = title?.trim() ?? "";
  const c = content?.trim() ?? "";
  if (!t.length || !c.length) throw new Error("TITLE_CONTENT_REQUIRED");
  if (t.length > POST_TITLE_MAX) throw new Error("TITLE_TOO_LONG");
  if (c.length > POST_CONTENT_MAX) throw new Error("CONTENT_TOO_LONG");
}

function slugifyTitle(title: string): string {
  const s = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return s || "bai-dang";
}

async function ensureUniqueSlug(clubId: string, base: string, excludePostId?: string): Promise<string> {
  let slug = base;
  let n = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.post.findFirst({
      where: {
        clubId,
        slug,
        ...(excludePostId ? { NOT: { id: excludePostId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function attachCourtNames<T extends { linkedCourtId: string | null }>(
  posts: T[]
): Promise<(T & { courtName: string | null })[]> {
  const ids = [...new Set(posts.map((p) => p.linkedCourtId).filter(Boolean))] as string[];
  if (!ids.length) {
    return posts.map((p) => ({ ...p, courtName: null }));
  }
  const courts = await prisma.court.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const map = Object.fromEntries(courts.map((c) => [c.id, c.name]));
  return posts.map((p) => ({
    ...p,
    courtName: p.linkedCourtId ? map[p.linkedCourtId] ?? null : null,
  }));
}

/**
 * Tạo bài đăng mới lên Bảng tin (News Feed)
 */
export async function createPost(
  clubId: string,
  ownerId: string,
  data: {
    type: PostType;
    title: string;
    content: string;
    imageUrl?: string;
    linkedCourtId?: string;
    linkedDate?: Date;
    expiresAt?: Date;
  }
) {
  assertLengths(data.title, data.content);

  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId },
    select: { id: true, name: true },
  });
  if (!club) throw new Error("CLUB_NOT_FOUND_OR_UNAUTHORIZED");

  const base = slugifyTitle(data.title);
  const slug = await ensureUniqueSlug(club.id, base);

  const post = await prisma.post.create({
    data: {
      clubId,
      slug,
      type: data.type,
      title: data.title.trim(),
      content: data.content.trim(),
      imageUrl: data.imageUrl?.trim() || undefined,
      linkedCourtId: data.linkedCourtId,
      linkedDate: data.linkedDate,
      expiresAt: data.expiresAt,
    },
  });

  let notificationsSent = 0;
  try {
    const { notified } = await notifyPlayersAboutOwnerPost({
      clubId: club.id,
      clubName: club.name,
      postType: data.type,
      title: data.title,
      content: data.content,
    });
    notificationsSent = notified;
  } catch (err) {
    console.error("notifyPlayersAboutOwnerPost failed:", err);
  }

  return { post, notificationsSent };
}

export async function updatePost(
  postId: string,
  ownerId: string,
  data: {
    type?: PostType;
    title?: string;
    content?: string;
    imageUrl?: string | null;
    linkedCourtId?: string | null;
    linkedDate?: Date | null;
    expiresAt?: Date | null;
  }
) {
  const existing = await prisma.post.findFirst({
    where: { id: postId, club: { ownerId } },
  });
  if (!existing) throw new Error("POST_NOT_FOUND_OR_UNAUTHORIZED");

  const title = data.title !== undefined ? data.title : existing.title;
  const content = data.content !== undefined ? data.content : existing.content;
  assertLengths(title, content);

  let slug = existing.slug;
  if (data.title !== undefined && data.title.trim() !== existing.title) {
    const base = slugifyTitle(title);
    slug = await ensureUniqueSlug(existing.clubId, base, postId);
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      title: title.trim(),
      content: content.trim(),
      slug,
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl?.trim() || null } : {}),
      ...(data.linkedCourtId !== undefined ? { linkedCourtId: data.linkedCourtId } : {}),
      ...(data.linkedDate !== undefined ? { linkedDate: data.linkedDate } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt } : {}),
    },
  });

  return updated;
}

export async function incrementPostView(postId: string) {
  const r = await prisma.post.updateMany({
    where: { id: postId, status: "ACTIVE", deletedAt: null },
    data: { viewCount: { increment: 1 } },
  });
  return r.count > 0;
}

export async function getPostById(postId: string) {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      status: "ACTIVE",
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      club: { select: { name: true, logoUrl: true, address: true, slug: true } },
    },
  });
  if (!post) return null;
  const [row] = await attachCourtNames([post]);
  return row;
}

/** Chi tiết bài đăng theo slug CLB + slug bài (chia sẻ link). */
export async function getPostByClubSlug(clubSlug: string, postSlug: string) {
  const club = await prisma.club.findFirst({
    where: { slug: clubSlug, deletedAt: null },
    select: { id: true },
  });
  if (!club) return null;

  const post = await prisma.post.findFirst({
    where: {
      clubId: club.id,
      slug: postSlug,
      status: "ACTIVE",
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      club: { select: { name: true, logoUrl: true, address: true, slug: true } },
    },
  });
  if (!post) return null;
  const [row] = await attachCourtNames([post]);
  return row;
}

/**
 * Lấy danh sách bài đăng — User: ẩn bài khi sân đã hết slot trong ngày (logic cũ).
 * Pagination: truyền `limit` > 0 để nhận `{ items, total, page, limit }`.
 */
export async function getPosts(filters: {
  clubId?: string;
  type?: PostType;
  isUser?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const rawLimit = filters.limit && filters.limit > 0 ? filters.limit : 0;
  const limit = rawLimit > 0 ? Math.min(rawLimit, 100) : 0;
  const usePaging = limit > 0;

  const where: Prisma.PostWhereInput = {
    status: "ACTIVE",
    ...(filters.clubId && { clubId: filters.clubId }),
    ...(filters.type && { type: filters.type }),
    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
  };

  const includeClub = {
    club: { select: { name: true, logoUrl: true, address: true, slug: true } },
  };

  if (!filters.isUser) {
    if (usePaging) {
      const total = await prisma.post.count({ where });
      const posts = await prisma.post.findMany({
        where,
        include: includeClub,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
      const items = await attachCourtNames(posts);
      return { items, total, page, limit };
    }
    const posts = await prisma.post.findMany({
      where,
      include: includeClub,
      orderBy: { createdAt: "desc" },
    });
    return attachCourtNames(posts);
  }

  /* User feed — lọc slot còn trống */
  const candidateLimit = usePaging ? Math.min(500, Math.max(limit * page, limit * 5)) : undefined;
  let posts = await prisma.post.findMany({
    where,
    include: includeClub,
    orderBy: { createdAt: "desc" },
    ...(candidateLimit ? { take: candidateLimit } : {}),
  });

  const enriched = await attachCourtNames(posts);
  const processedPosts = [];
  for (const post of enriched) {
    if (post.linkedCourtId && post.linkedDate) {
      const availableCount = await prisma.timeSlot.count({
        where: {
          courtId: post.linkedCourtId,
          startTime: {
            gte: new Date(new Date(post.linkedDate).setHours(0, 0, 0, 0)),
            lte: new Date(new Date(post.linkedDate).setHours(23, 59, 59, 999)),
          },
          status: "AVAILABLE",
        },
      });
      if (availableCount === 0) continue;
    }
    processedPosts.push(post);
  }

  if (!usePaging) return processedPosts;

  const total = processedPosts.length;
  const start = (page - 1) * limit;
  const items = processedPosts.slice(start, start + limit);
  return { items, total, page, limit };
}

export async function deletePost(postId: string, ownerId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, club: { ownerId } },
  });

  if (!post) throw new Error("POST_NOT_FOUND_OR_UNAUTHORIZED");

  return prisma.post.delete({
    where: { id: postId },
  });
}
