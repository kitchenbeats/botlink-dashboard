import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/avatar";
import { useUser } from "@/lib/hooks/use-user";

export default function UserDetailsTile() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="relative flex items-center gap-2 overflow-hidden">
      <Avatar className="size-9">
        <AvatarImage src={user.user_metadata.avatar_url} />
        <AvatarFallback>
          {user.email?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex w-full max-w-full flex-col truncate normal-case">
        <div className="truncate text-fg-200">{user.user_metadata.name}</div>
        <div className="truncate font-sans text-fg-300">{user.email}</div>
      </div>
      <ChevronRight className="absolute right-0 top-0 size-4 -rotate-45 text-accent" />
    </div>
  );
}
