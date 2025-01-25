import { Suspense } from "react";
import BillingPageClient from "./page-client";

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageClient />
    </Suspense>
  );
}
