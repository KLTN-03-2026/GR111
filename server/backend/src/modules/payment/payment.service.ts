import crypto from "crypto";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { notifyNewBooking } from "@/lib/socket";
import { eventEmitter } from "@/lib/events";

const VNP_TMN_CODE = process.env.VNP_TMN_CODE || "";
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || "";
const VNP_URL = process.env.VNP_URL || "";
const VNP_RETURN_URL = process.env.VNP_RETURN_URL || "";

export async function createPaymentUrl(bookingId: string, amount: number, method: string, ipAddr: string = "127.0.0.1") {
  if (method === "MOMO") {
    return await createMoMoPaymentUrl(bookingId, amount);
  }
  if (method === "CASH" || method === "BANK_TRANSFER") {
    return null;
  }

  // VNPAY
  const date = new Date();
  const pad = (n: number) => n < 10 ? '0' + n : n;
  const createDate = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  
  const orderId = bookingId;

  let vnp_Params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan don dat san ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: (amount * 100).toString(),
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  vnp_Params = sortObject(vnp_Params);
  const signData = new URLSearchParams(vnp_Params).toString();
  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = new URL(VNP_URL);
  Object.entries(vnp_Params).forEach(([key, value]) => {
    paymentUrl.searchParams.append(key, value);
  });

  return paymentUrl.toString();
}

/**
 * MoMo Create Payment URL Integration
 */
async function createMoMoPaymentUrl(bookingId: string, amount: number) {
  const partnerCode = process.env.MOMO_V2_PARTNER_CODE;
  const accessKey = process.env.MOMO_V2_ACCESS_KEY;
  const secretKey = process.env.MOMO_V2_SECRET_KEY;
  const endpoint = process.env.MOMO_V2_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";
  const redirectUrl = process.env.MOMO_V2_REDIRECT_URL || "";
  const ipnUrl = process.env.MOMO_V2_IPN_URL || "";

  console.log("MoMo Env Check - PARTNER:", partnerCode);
  console.log("MoMo Env Check - ACCESS:", accessKey);
  console.log("MoMo Env Check - SECRET:", secretKey?.substring(0, 5) + "...");

  if (!partnerCode || !accessKey || !secretKey) {
    console.error("MoMo configuration missing in .env");
    throw new Error("MOMO_CONFIG_MISSING");
  }

  const requestId = bookingId;
  const orderInfo = "Thanh toan san " + bookingId; 
  const extraData = ""; 
  const requestType = "captureWallet";

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${bookingId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    partnerName: "Sports Field",
    storeId: partnerCode,
    requestId,
    amount: Math.round(amount),
    orderId: bookingId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    autoCapture: true,
    extraData,
    signature
  };

  try {
    const response = await axios.post(endpoint, requestBody);
    if (response.data && response.data.payUrl) {
      return response.data.payUrl;
    }
    console.error("MoMo API error response:", response.data);
    throw new Error("MOMO_CREATE_URL_FAILED");
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const momoMsg = error.response.data?.message || JSON.stringify(error.response.data);
      console.error("MoMo Error Body:", error.response.data);
      throw new Error(`MOMO_ERROR: ${momoMsg}`);
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("MoMo integration error:", errMsg);
    throw new Error("MOMO_GATEWAY_ERROR");
  }
}

export async function processPaymentWebhook(params: Record<string, unknown>) {
  // Check if it's MoMo or VNPay
  if (params.partnerCode) {
    return await processMoMoWebhook(params as Record<string, string | number>);
  } else if (params.vnp_SecureHash) {
    return await processVNPayWebhook(params as Record<string, string>);
  }
  throw new Error("INVALID_WEBHOOK_PARAMS");
}

async function processVNPayWebhook(vnp_Params: Record<string, string>) {
  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);
  const signData = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash !== signed) {
    throw new Error("INVALID_SIGNATURE");
  }

  const responseCode = vnp_Params["vnp_ResponseCode"];
  const bookingId = vnp_Params["vnp_TxnRef"];

  if (responseCode === "00") {
    return await handleSuccessfulPayment(bookingId, vnp_Params["vnp_TransactionNo"]);
  } else {
    return await handleFailedPayment(bookingId);
  }
}

async function processMoMoWebhook(params: Record<string, string | number>) {
  const partnerCode = process.env.MOMO_V2_PARTNER_CODE;
  const accessKey = process.env.MOMO_V2_ACCESS_KEY;
  const secretKey = process.env.MOMO_V2_SECRET_KEY;

  if (!partnerCode || !accessKey || !secretKey) {
    throw new Error("MOMO_CONFIG_MISSING");
  }

  const { signature, amount, orderId, requestId, resultCode, message, transId } = params;

  // Re-calculate signature to verify
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${params.extraData || ""}&message=${message}&orderId=${orderId}&orderInfo=${params.orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${params.responseTime}&resultCode=${resultCode}&transId=${transId}`;
  
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  if (signature !== expectedSignature) {
    throw new Error("INVALID_SIGNATURE");
  }

  const realBookingId = String(orderId); // MoMo uses orderId for our bookingId

  if (resultCode === 0) {
    return await handleSuccessfulPayment(realBookingId, String(transId));
  } else {
    return await handleFailedPayment(realBookingId);
  }
}

async function handleSuccessfulPayment(bookingId: string, transactionId: string) {
  const updatedBooking = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { bookingId } });
    if (!payment || payment.status === "CONFIRMED") return null;

    await tx.payment.update({
      where: { bookingId },
      data: {
        status: "CONFIRMED",
        paidAt: new Date(),
        transactionRef: transactionId,
      },
    });

    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
      include: { items: { include: { timeSlot: { include: { court: true } } } }, club: true }
    });

    return booking;
  });

  if (updatedBooking) {
    if (updatedBooking.clubId) {
      notifyNewBooking(updatedBooking.clubId, {
        booking: updatedBooking,
        type: 'payment-confirmed'
      });

      eventEmitter.emit('booking.status_updated', {
        clubId: updatedBooking.clubId,
        booking: updatedBooking,
        type: 'payment-confirmed'
      });
    }
  }
  return { RspCode: "00", Message: "Confirm Success" };
}

async function handleFailedPayment(bookingId: string) {
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
    include: { club: true }
  });

  await prisma.payment.update({
    where: { bookingId },
    data: { status: "CANCELLED" }
  });

  if (updatedBooking.clubId) {
    notifyNewBooking(updatedBooking.clubId, {
      booking: updatedBooking,
      type: 'booking-cancelled'
    });
  }

  return { RspCode: "02", Message: "Order failed" };
}

export async function submitPaymentProof(bookingId: string, proofImageUrl: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { bookingId }
    });

    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    await tx.payment.update({
      where: { bookingId },
      data: {
        proofImageUrl,
        status: "WAITING_PAYMENT",
      }
    });

    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "WAITING_PAYMENT" }
    });

    if (updatedBooking.clubId) {
      notifyNewBooking(updatedBooking.clubId, {
        booking: updatedBooking,
        type: 'payment-proof-submitted'
      });
    }

    return updatedBooking;
  });
}

function sortObject(obj: Record<string, string>) {
  const sorted: Record<string, string> = {};
  const str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
