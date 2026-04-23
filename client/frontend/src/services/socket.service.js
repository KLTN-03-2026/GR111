import { io } from "socket.io-client";

function resolveSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return String(explicit).replace(/\/$/, "");
  const api = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  try {
    const base = String(api).replace(/\/?api\/?$/i, "").replace(/\/$/, "");
    return base || "http://localhost:3000";
  } catch {
    return "http://localhost:3000";
  }
}

const API_URL = resolveSocketUrl();

class SocketService {
  constructor() {
    this.socket = null;
    this.currentVenueId = null;
    this.bookingUpdateCallback = null;
    this.recentNotificationsCallback = null;
    this.bookingStatusChangedCallback = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(API_URL, {
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log("Socket connected:", this.socket.id, API_URL);
        if (this.currentVenueId) {
          this.socket.emit("join-venue", this.currentVenueId);
        }
      });

      this.socket.on("connect_error", (err) => {
        console.warn("Socket connect_error:", err?.message || err, API_URL);
      });

      this.socket.on("booking-updated", (data) => {
        console.log("Socket received booking-updated:", data);
        if (this.bookingUpdateCallback) this.bookingUpdateCallback(data);
      });

      this.socket.on("recent-notifications", (list) => {
        console.log("Socket received recent-notifications:", list?.length);
        if (this.recentNotificationsCallback) this.recentNotificationsCallback(list);
      });

      this.socket.on("booking-status-changed", (data) => {
        console.log("Socket received booking-status-changed:", data);
        if (this.bookingStatusChangedCallback) this.bookingStatusChangedCallback(data);
      });

      console.log("Connecting to socket server:", API_URL);
    }
    return this.socket;
  }

  joinVenue(venueId) {
    if (!venueId) return;
    this.currentVenueId = venueId;
    if (this.socket) {
      this.socket.emit("join-venue", venueId);
      console.log(`Joined venue: ${venueId}`);
    }
  }

  leaveVenue(venueId) {
    if (this.socket && venueId) {
      this.socket.emit("leave-venue", venueId);
      console.log(`Left venue: ${venueId}`);
    }
    if (this.currentVenueId === venueId) {
      this.currentVenueId = null;
    }
  }

  /** Một listener; gán lại sẽ thay callback (Dashboard dùng một handler). */
  onBookingUpdate(callback) {
    this.bookingUpdateCallback = callback;
  }

  /** Khi join venue, server có thể gửi lại thông báo đã lưu Redis (kể cả trước khi mở trang). */
  onRecentNotifications(callback) {
    this.recentNotificationsCallback = callback;
  }

  joinBooking(bookingId) {
    if (this.socket) {
      this.socket.emit("join-booking", bookingId);
      console.log(`Joined booking room: ${bookingId}`);
    }
  }

  leaveBooking(bookingId) {
    if (this.socket) {
      this.socket.emit("leave-booking", bookingId);
      console.log(`Left booking room: ${bookingId}`);
    }
  }

  onBookingStatusChanged(callback) {
    this.bookingStatusChangedCallback = callback;
  }

  offBookingStatusChanged() {
    this.bookingStatusChangedCallback = null;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentVenueId = null;
      console.log("Socket disconnected");
    }
  }
}

export const socketService = new SocketService();
