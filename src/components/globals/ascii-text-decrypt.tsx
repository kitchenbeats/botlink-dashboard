"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function AsciiTextDecrypt({
  title,
  interval = 30,
  obscureCharacter = "X",
  className,
}: {
  title: string;
  interval?: number;
  obscureCharacter?: string;
  className?: string;
}) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosition = 3 + title.length + 6;
  const baseText = useRef(title + " ".repeat(6)).current;

  const [position, setPosition] = useState(startPosition);

  const displayedText = useMemo(() => {
    return (
      "\\\\ " +
      baseText.slice(3, position).replace(/./g, obscureCharacter) +
      baseText.slice(position)
    );
  }, [position, baseText, obscureCharacter]);

  const animate = useCallback(() => {
    if (position <= 0) return;

    timeout.current = setTimeout(() => {
      setPosition((prev) => prev - 1);
    }, interval);
  }, [position, interval]);

  useEffect(() => {
    const startAnimation = () => {
      animate();
    };

    startAnimation();

    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [animate]);

  return (
    <h1 className={cn("text-2xl font-medium text-fg-100", className)}>
      {displayedText.split("").map((char, index) => (
        <span
          key={index}
          className={
            char === obscureCharacter
              ? "text-fg"
              : char === "\\"
                ? "text-fg-500"
                : ""
          }
        >
          {char}
        </span>
      ))}
    </h1>
  );
}
