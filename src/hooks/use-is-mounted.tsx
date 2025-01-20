import { useEffect, useLayoutEffect, useState } from "react";

export default function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
