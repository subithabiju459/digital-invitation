"use client";

import { useState } from "react";

type CashfreeCheckout = {
  checkout: (options: { paymentSessionId: string }) => Promise<unknown> | void;
};

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" }) => CashfreeCheckout;
  }
}

let cashfreeScript: Promise<void> | undefined;

function loadCashfreeCheckout() {
  if (window.Cashfree) return Promise.resolve();
  if (!cashfreeScript) {
    cashfreeScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Cashfree checkout could not be loaded."));
      document.head.appendChild(script);
    });
  }
  return cashfreeScript;
}

export function PayAndPublish({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const startCheckout = async () => {
    setState("loading");
    setError("");
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ slug }),
      });
      const result = await response.json() as { paymentSessionId?: string; error?: string };
      if (!response.ok || !result.paymentSessionId) throw new Error(result.error || "We could not start checkout.");
      await loadCashfreeCheckout();
      const cashfree = window.Cashfree?.({ mode: "sandbox" });
      if (!cashfree) throw new Error("Cashfree checkout could not be loaded.");
      await cashfree.checkout({ paymentSessionId: result.paymentSessionId });
      setState("idle");
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "We could not start checkout.");
      setState("error");
    }
  };

  return <div className="vv-payment-launch">
    <p>Private preview</p>
    <button type="button" onClick={startCheckout} disabled={state === "loading"}>{state === "loading" ? "Preparing secure checkout…" : "Pay & Publish"}<span>→</span></button>
    {error && <small role="alert">{error}</small>}
  </div>;
}
