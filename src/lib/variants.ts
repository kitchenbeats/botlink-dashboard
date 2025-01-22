import { cva } from "class-variance-authority";

export const cardVariants = cva("", {
  variants: {
    variant: {
      default: "bg-gradient-to-b from-bg-100 to-bg border border-border",
      surface: "bg-gradient-to-b from-bg-300 to-bg-400 border border-border",
      layer: "bg-bg-100/30 backdrop-blur-md border border-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
