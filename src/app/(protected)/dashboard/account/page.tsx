import PageClient from "./page-client";
import { Suspense } from "react";

export default function AccountPage() {
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  );
}
