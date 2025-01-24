import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";

function Skeleton({
  className,
  width = 60,
  height = 12,
  waveSpeed = 0.1,
  waveFrequency = 0.2,
  waveAmplitude = 0.4,
  frameInterval = 20,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  width?: number;
  height?: number;
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  frameInterval?: number;
}) {
  const [time, setTime] = useState(0);
  const asciiGradient = [":", "/", "~", "*", "=", "%", "#", "@"];

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => t + 1);
    }, frameInterval);
    return () => clearInterval(interval);
  }, [frameInterval]);

  const rows = Array(height)
    .fill(0)
    .map(() => {
      return Array(width)
        .fill(0)
        .map((_, col) => {
          let waveVal =
            Math.sin(col * waveFrequency + time * waveSpeed) * waveAmplitude +
            0.5;
          waveVal = Math.max(0, Math.min(1, waveVal));
          const index = Math.floor(waveVal * (asciiGradient.length - 1));
          return asciiGradient[index];
        })
        .join("");
    });

  return (
    <div
      className={cn(
        "m-0 select-none whitespace-pre p-0 font-mono leading-tight duration-200 animate-in fade-in",
        className,
      )}
      {...props}
    >
      {rows.map((row, i) => (
        <div
          className="bg-[linear-gradient(to_right,transparent,hsl(var(--fg-300))_10%,hsl(var(--fg-300))_90%,transparent)] bg-clip-text text-transparent"
          key={i}
        >
          {row}
        </div>
      ))}
    </div>
  );
}

export { Skeleton };
