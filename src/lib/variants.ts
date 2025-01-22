import { cva } from "class-variance-authority";

export const cardVariants = cva("", {
  variants: {
    variant: {
      default: "bg-gradient-to-b from-bg-100 to-bg border border-border",
      layer: "bg-bg-100/40 backdrop-blur-lg border border-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
