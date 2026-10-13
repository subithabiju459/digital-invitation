import { createHmac, timingSafeEqual } from "node:crypto";

export function cashfreeWebhookSignature(rawBody: string, timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(`${timestamp}${rawBody}`).digest("base64");
}

export function cashfreeWebhookSignatureMatches(rawBody: string, timestamp: string | null, signature: string | null, secret: string) {
  if (!timestamp || !signature) return false;
  const expectedBuffer = Buffer.from(cashfreeWebhookSignature(rawBody, timestamp, secret));
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}
