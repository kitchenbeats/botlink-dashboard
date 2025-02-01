import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/primitives/avatar";
import { User } from "@supabase/supabase-js";

export default function UserDetailsTile({ user }: { user: User }) {
  return (
    <div className="relative flex items-center gap-2 pr-2">
      <Avatar className="size-9">
        <AvatarImage src={user.user_metadata.avatar_url} />
        <AvatarFallback>
          {user.email?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col normal-case">
        <div className="text-fg-200 max-w-[120px] truncate whitespace-nowrap">
          {user.user_metadata.name}
        </div>
        <div className="text-fg-300 max-w-[140px] truncate whitespace-nowrap font-sans">
          {user.email}
        </div>
      </div>
      <ChevronRight className="text-accent absolute right-0 top-0 size-4 -rotate-45" />
    </div>
  );
}
