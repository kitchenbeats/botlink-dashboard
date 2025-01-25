import { Suspense } from "react";
import KeysPageClient from "./page-client";

export default function KeysPage() {
  return (
    <Suspense>
      <KeysPageClient />
    </Suspense>
  );
}
