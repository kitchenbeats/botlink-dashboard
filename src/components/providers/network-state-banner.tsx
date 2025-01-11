"use client";

import { exponentialSmoothing } from "@/lib/utils";
import { useNetworkState } from "@uidotdev/usehooks";
import { AnimatePresence, motion } from "motion/react";

export default function NetworkStateBanner() {
  const { online } = useNetworkState();

  return (
    <AnimatePresence initial={false}>
      {!online && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={{ duration: 0.2, ease: exponentialSmoothing(5) }}
          className="w-full overflow-hidden border-b border-red-500/20 bg-red-500/10"
          suppressHydrationWarning
        >
          <div className="container mx-auto px-4 py-2">
            <p className="text-center text-sm font-medium text-red-500">
              You are currently offline.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
