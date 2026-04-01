import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-venue", (venueId: string) => {
      socket.join(`venue-${venueId}`);
      console.log(`Socket ${socket.id} joined venue-${venueId}`);
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

export const notifyNewBooking = (venueId: string, bookingData: unknown) => {
  if (io) {
    io.to(`venue-${venueId}`).emit("booking-updated", bookingData);
  }
};

/**
 * Gửi thông báo cập nhật trạng thái đơn đặt sân đến client đang theo dõi booking đó
 */
export const notifyBookingStatusChanged = (bookingId: string, data: unknown) => {
  if (io) {
    io.to(`booking-${bookingId}`).emit("booking-status-changed", data);
    console.log(`📡 Emitted booking-status-changed to booking-${bookingId}`);
  }
};
