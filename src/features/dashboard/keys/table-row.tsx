"use client";

import { useToast } from "@/lib/hooks/use-toast";
import { TableCell, TableRow } from "@/ui/primitives/table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { ObscuredApiKey } from "@/server/keys/types";
import { deleteApiKeyAction } from "@/server/keys/key-actions";
import { useParams } from "next/navigation";

interface TableRowProps {
  apiKey: ObscuredApiKey;
  index: number;
}

export default function ApiKeyTableRow({ apiKey, index }: TableRowProps) {
  const { toast } = useToast();
  const { teamId } = useParams();

  const deleteKey = async (apiKeyId: string) => {
    try {
      await deleteApiKeyAction({ teamId: teamId as string, apiKeyId });
      toast({
        title: "Success",
        description: "API key deleted successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "error",
      });
    }
  };

  return (
    <TableRow key={`${apiKey.name}-${index}`}>
      <TableCell className="flex flex-col gap-1 text-left font-mono">
        {apiKey.name}
        <span className="text-fg-500 pl-1">{apiKey.maskedKey}</span>
      </TableCell>
      <TableCell className="text-fg-500 max-w-36 overflow-hidden truncate">
        <span className="max-w-full truncate">{apiKey.createdBy}</span>
      </TableCell>
      <TableCell className="text-fg-300 text-right">
        {apiKey.createdAt
          ? new Date(apiKey.createdAt).toLocaleDateString()
          : "-"}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="text-error"
              onClick={() => deleteKey(apiKey.id)}
            >
              X Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
