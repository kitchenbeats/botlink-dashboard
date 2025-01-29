import { Loader } from "@/ui/loader";

export default function LoadingLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Loader className="text-xl" variant="compute" />
    </div>
  );
}
