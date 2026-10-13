"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PaymentState = "checking" | "paid" | "pending" | "failed" | "error";

export function PaymentReturnStatus() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PaymentState>("checking");
  const [inviteUrl, setInviteUrl] = useState("");
  const [message, setMessage] = useState("Verifying your payment securely…");

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId) {
      setState("error");
      setMessage("We could not find this payment order.");
      return;
    }
    const verify = async () => {
      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
          cache: "no-store",
        });
        const result = await response.json() as { status?: PaymentState; invitationSlug?: string; error?: string };
        if (!response.ok) throw new Error(result.error || "We could not verify this payment.");
        if (result.status === "paid" && result.invitationSlug) {
          setState("paid");
          setInviteUrl(`/invite/${result.invitationSlug}`);
          setMessage("Payment verified. Your invitation is now published.");
          return;
        }
        if (result.status === "pending") {
          setState("pending");
          setMessage("Your payment is still being confirmed. Please check again shortly.");
          return;
        }
        setState("failed");
        setMessage("This payment was not completed. You can return to your private preview and try again.");
      } catch (error) {
        setState("error");
        setMessage(error instanceof Error ? error.message : "We could not verify this payment.");
      }
    };
    void verify();
  }, [searchParams]);

  return <main className="payment-return"><div className="payment-return-card"><span>✦</span><p>{message}</p>{state === "paid" && <a href={inviteUrl}>Open published invitation →</a>}{state === "pending" && <button type="button" onClick={() => window.location.reload()}>Check again</button>}<a className="payment-return-home" href="/">Return to AMORA</a></div></main>;
}
