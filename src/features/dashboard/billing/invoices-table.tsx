import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";
import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import { Loader } from "@/ui/loader";
import { Button } from "@/ui/primitives/button";
import { Suspense } from "react";
import Link from "next/link";
import { getInvoices } from "@/server/billing/get-invoices";
import { bailOutFromPPR } from "@/lib/utils/server";

interface BillingInvoicesTableProps {
  teamId: string;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-left">
        <Alert className="w-full text-left" variant="error">
          <AlertTitle>Error loading invoices.</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </TableCell>
    </TableRow>
  );
}

function LoadingFallback() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-left">
        <Alert className="w-full text-left" variant="contrast2">
          <AlertTitle className="flex items-center gap-2">
            <Loader variant="compute" />
            Loading invoices...
          </AlertTitle>
          <AlertDescription>This may take a moment.</AlertDescription>
        </Alert>
      </TableCell>
    </TableRow>
  );
}

async function InvoicesTableContent({ teamId }: { teamId: string }) {
  bailOutFromPPR();

  try {
    const res = await getInvoices({ teamId });

    if (res.type === "error") {
      throw new Error(res.message);
    }

    const invoices = res.data;

    if (!invoices?.length) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-left">
            <Alert className="w-full text-left" variant="contrast1">
              <AlertTitle>No invoices found.</AlertTitle>
              <AlertDescription>
                Your team has no invoices yet.
              </AlertDescription>
            </Alert>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {invoices.map((invoice) => (
          <TableRow key={invoice.url}>
            <TableCell>
              {new Date(invoice.date_created).toLocaleDateString()}
            </TableCell>
            <TableCell>${invoice.cost.toFixed(2)}</TableCell>
            <TableCell>{invoice.paid ? "Paid" : "Pending"}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <Link href={invoice.url} target="_blank">
                  View Invoice
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  } catch (error) {
    return <ErrorFallback error={error as Error} />;
  }
}

export default function BillingInvoicesTable({
  teamId,
}: BillingInvoicesTableProps) {
  return (
    <Table className="w-full animate-in fade-in">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <Suspense fallback={<LoadingFallback />}>
          <InvoicesTableContent teamId={teamId} />
        </Suspense>
      </TableBody>
    </Table>
  );
}
