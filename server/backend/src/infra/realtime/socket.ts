import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "@/core/config/env";
import { pubClient, subClient, redis } from "@/infra/cache/redis";

let io: SocketIOServer | null = null;

const NOTIFICATION_LIMIT = 50;
const NOTIFICATION_EXPIRE = 24 * 60 * 60;

export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.NEXT_PUBLIC_APP_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
    adapter: createAdapter(pubClient, subClient),
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-venue", async (venueId: string) => {
      socket.join(`venue-${venueId}`);
      console.log(`Socket ${socket.id} joined venue-${venueId}`);

      try {
        const notifications = await redis.lrange(`notifications:venue:${venueId}`, 0, -1);
        if (notifications.length > 0) {
          const parsed = notifications.map((item) => JSON.parse(item));
          socket.emit("recent-notifications", parsed);
        }
      } catch (error) {
        console.error("Redis fetch notifications error:", error);
      }
    });

    socket.on("leave-venue", (venueId: string) => {
      socket.leave(`venue-${venueId}`);
      console.log(`Socket ${socket.id} left venue-${venueId}`);
    });

    socket.on("join-booking", (bookingId: string) => {
      socket.join(`booking-${bookingId}`);
      console.log(`Socket ${socket.id} joined booking-${bookingId}`);
    });

    socket.on("leave-booking", (bookingId: string) => {
      socket.leave(`booking-${bookingId}`);
      console.log(`Socket ${socket.id} left booking-${bookingId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const notifyNewBooking = async (venueId: string, bookingData: unknown) => {
  if (io) {
    io.to(`venue-${venueId}`).emit("booking-updated", bookingData);

    try {
      const key = `notifications:venue:${venueId}`;
      const notification = JSON.stringify({
        ...(bookingData as object),
        timestamp: new Date().toISOString(),
      });

      await redis.lpush(key, notification);
      await redis.ltrim(key, 0, NOTIFICATION_LIMIT - 1);
      await redis.expire(key, NOTIFICATION_EXPIRE);
    } catch (error) {
      console.error("Failed to cache notification in Redis:", error);
    }
  }
};

export const notifyBookingStatusChanged = (bookingId: string, data: unknown) => {
  if (io) {
    io.to(`booking-${bookingId}`).emit("booking-status-changed", data);
    console.log(`Emitted booking-status-changed to booking-${bookingId}`);
  }
};
