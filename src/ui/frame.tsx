import { cn } from "@/lib/utils";
import Dotted from "./dotted";

interface FrameProps {
  children: React.ReactNode;
  classNames?: {
    wrapper?: string;
    frame?: string;
  };
}

export default function Frame({ children, classNames }: FrameProps) {
  return (
    <div
      className={cn(
        "relative flex h-fit w-fit border pb-2",
        classNames?.wrapper,
      )}
    >
      <Dotted />
      <div
        className={cn(
          "bg-bg relative w-full scale-[1.02] border",
          classNames?.frame,
        )}
      >
        {children}
      </div>
    </div>
  );
}
