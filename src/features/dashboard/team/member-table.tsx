import { Alert, AlertDescription, AlertTitle } from "@/ui/primitives/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";
import { Loader } from "@/ui/loader";
import { FC } from "react";
import MemberTableBody from "./member-table-body";
import { Suspense } from "react";

interface MemberTableProps {
  teamId: string;
}

const MemberTable: FC<MemberTableProps> = ({ teamId }) => {
  return (
    <Table className="w-full animate-in fade-in">
      <TableHeader>
        <TableRow>
          <th></th>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Added By</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <Suspense
          fallback={
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-left">
                <Alert className="w-full text-left" variant="contrast2">
                  <AlertTitle className="flex items-center gap-2">
                    <Loader variant="compute" />
                    Loading members...
                  </AlertTitle>
                  <AlertDescription>This may take a moment.</AlertDescription>
                </Alert>
              </TableCell>
            </TableRow>
          }
        >
          <MemberTableBody teamId={teamId} />
        </Suspense>
      </TableBody>
    </Table>
  );
};

export default MemberTable;
