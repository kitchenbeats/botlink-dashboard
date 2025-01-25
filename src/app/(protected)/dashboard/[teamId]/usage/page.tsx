import UsagePageClient from "./page-client";
import { Suspense } from "react";

export default function UsagePage() {
  return (
    <Suspense>
      <UsagePageClient />
    </Suspense>
  );
}
