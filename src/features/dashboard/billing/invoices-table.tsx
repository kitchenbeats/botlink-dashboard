"use client";

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
import { QUERY_KEYS } from "@/configs/query-keys";
import { useParams } from "next/navigation";
import { Button } from "@/ui/primitives/button";
import { getTeamInvoicesAction } from "@/actions/billing-actions";
import useSWR from "swr";

export default function BillingInvoicesTable() {
  const { teamId } = useParams();

  const {
    data: invoices,
    isLoading,
    error,
  } = useSWR(
    teamId ? QUERY_KEYS.TEAM_INVOICES(teamId as string) : null,
    async () => {
      const res = await getTeamInvoicesAction({ teamId: teamId as string });
      if (res.type === "error") {
        throw new Error(res.message);
      }
      return res.data;
    },
  );

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
        {isLoading && (
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
        )}

        {!isLoading && !error && !invoices?.length && (
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
        )}

        {error && (
          <TableRow>
            <TableCell colSpan={4} className="text-left">
              <Alert className="w-full text-left" variant="error">
                <AlertTitle>Error loading invoices.</AlertTitle>
                <AlertDescription>{error?.message}</AlertDescription>
              </Alert>
            </TableCell>
          </TableRow>
        )}

        {!isLoading &&
          invoices?.map((invoice) => (
            <TableRow key={invoice.date_created}>
              <TableCell>
                {new Date(invoice.date_created).toLocaleDateString()}
              </TableCell>
              <TableCell>${invoice.cost.toFixed(2)}</TableCell>
              <TableCell>{invoice.paid ? "Paid" : "Pending"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(invoice.url, "_blank")}
                >
                  View Invoice
                </Button>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
