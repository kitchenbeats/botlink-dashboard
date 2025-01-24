import { Button, ButtonProps } from "@/ui/primitives/button";
import { useClipboard } from "@/lib/hooks/use-clipboard";
import { CheckIcon, CopyIcon } from "lucide-react";
import { FC } from "react";

interface CopyButtonProps extends ButtonProps {
  value: string;
}

const CopyButton: FC<CopyButtonProps> = ({ value, ...props }) => {
  const [wasCopied, copy] = useClipboard();

  return (
    <Button size="icon" onClick={() => copy(value)} {...props}>
      {wasCopied ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </Button>
  );
};

export default CopyButton;
