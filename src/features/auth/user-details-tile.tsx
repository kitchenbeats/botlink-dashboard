import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/avatar";
import { User } from "@supabase/supabase-js";

export default function UserDetailsTile({ user }: { user: User }) {
  return (
    <div className="relative flex items-center gap-2">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={user.user_metadata.avatar_url} />
        <AvatarFallback>
          {user.email?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-fg-200 truncate">{user.user_metadata.name}</div>
        <div className="text-fg-300 truncate font-sans">{user.email}</div>
      </div>
      <ChevronRight className="text-accent size-4 shrink-0 -rotate-45" />
    </div>
  );
}
