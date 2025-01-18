import { createApiKeyAction } from "@/actions/key-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QUERY_KEYS } from "@/configs/query-keys";
import { useMutation } from "@tanstack/react-query";
import { FC, ReactNode, useState } from "react";

import CopyButton from "@/components/globals/copy-button";
import { mutate } from "swr";

interface CreateApiKeyDialogProps {
  teamId: string;
  children?: ReactNode;
}

const CreateApiKeyDialog: FC<CreateApiKeyDialogProps> = ({
  teamId,
  children,
}) => {
  const [keyName, setKeyName] = useState("");

  // mutations
  const {
    data: createdApiKey,
    mutate: createApiKey,
    isPending: isMutatingApiKeyCreation,
    reset: resetCreateApiKeyMutation,
  } = useMutation({
    mutationFn: async (name: string) => {
      const response = await createApiKeyAction({ teamId, name });

      if (response.type === "error") {
        throw new Error(response.message);
      }

      return response.data.createdApiKey;
    },
    onSuccess: () => {
      mutate(QUERY_KEYS.TEAM_API_KEYS(teamId));
    },
    onError: (error) => {
      console.error("createApiKeyAction error:", error.message);
    },
  });

  return (
    <Dialog
      onOpenChange={(value) => {
        if (value) return;

        setKeyName("");
        resetCreateApiKeyMutation();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for your team.
          </DialogDescription>
        </DialogHeader>

        {!createdApiKey ? (
          <form
            key="create-form"
            onSubmit={(e) => {
              e.preventDefault();
              createApiKey(keyName);
            }}
          >
            <div className="flex flex-col gap-3 px-2 py-6">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="my-secret-key"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" loading={isMutatingApiKeyCreation}>
                Create Key
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="flex flex-col gap-3 px-2 py-6 duration-200 animate-in fade-in slide-in-from-right-5">
              <Label>[ Your API Key ]</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdApiKey} className="font-mono" />
                <CopyButton value={createdApiKey} />
              </div>
              <Alert variant="contrast2" className="mt-4">
                <AlertTitle>Important!</AlertTitle>
                <AlertDescription className="text-contrast-2">
                  Make sure to copy your API key now. You won't be able to see
                  it again!
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="muted">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateApiKeyDialog;
