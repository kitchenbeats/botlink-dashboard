import { Table } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import { SortingState } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { Search, SortAsc, SortDesc, X } from "lucide-react";
import { cn, exponentialSmoothing } from "@/lib/utils";

const filterItemVariants = {
  initial: { x: 5, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 5, opacity: 0 },
  transition: { duration: 0.2 },
};

const filterContainerVariants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: exponentialSmoothing(5) },
};

interface TableFilterSectionProps {
  globalFilter: string;
  sorting: SortingState;
  table: Table<any>;
  className?: string;
}

const TableFilterSection = ({
  globalFilter,
  sorting,
  table,
  className,
}: TableFilterSectionProps) => (
  <AnimatePresence initial={false}>
    {(globalFilter || sorting.length > 0) && (
      <motion.div
        className={cn("flex flex-col gap-3", className)}
        variants={filterContainerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: exponentialSmoothing(5) }}
      >
        <h4 className="text-xs text-accent">
          - <span className="text-fg">Filters</span>
        </h4>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {globalFilter && (
              <motion.div
                variants={filterItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.setGlobalFilter("")}
                  className="normal-case"
                >
                  <Search className="size-3 text-accent" /> {globalFilter}
                  <X className="ml-1 h-3 w-3" />
                </Button>
              </motion.div>
            )}
            {sorting.map((sort) => (
              <motion.div
                key={sort.id}
                variants={filterItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.getColumn(sort.id)?.clearSorting()}
                  className="normal-case"
                >
                  <span className="text-accent">
                    {sort.desc ? (
                      <SortDesc className="size-3" />
                    ) : (
                      <SortAsc className="size-3" />
                    )}
                  </span>{" "}
                  {
                    table.getFlatHeaders().find((h) => h.id === sort.id)?.column
                      .columnDef.header as string
                  }{" "}
                  <X className="ml-1 h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="h-4 w-full" />
      </motion.div>
    )}
  </AnimatePresence>
);

export default TableFilterSection;
