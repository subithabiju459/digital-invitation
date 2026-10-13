import { Suspense } from "react";
import { PaymentReturnStatus } from "@/app/_components/payment-return-status";

export default function PaymentReturnPage() {
  return <Suspense fallback={<main className="payment-return"><p>Checking your payment…</p></main>}><PaymentReturnStatus /></Suspense>;
}
