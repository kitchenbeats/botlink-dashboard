import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { OnChangeFn, SortingState } from "@tanstack/react-table";
import { createHashStorage } from "@/lib/utils/store";

interface TemplateTableState {
  // Table state
  sorting: SortingState;
  globalFilter: string;
  // Filter state
  cpuCount?: number;
  memoryMB?: number;
  isPublic?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

interface TemplateTableActions {
  // Table actions
  setSorting: OnChangeFn<SortingState>;
  setGlobalFilter: OnChangeFn<string>;
  // Filter actions
  setCpuCount: (value?: number) => void;
  setMemoryMB: (value?: number) => void;
  setIsPublic: (value?: boolean) => void;
  setCreatedAfter: (value?: Date) => void;
  setCreatedBefore: (value?: Date) => void;
  resetFilters: () => void;
}

type Store = TemplateTableState & TemplateTableActions;

const initialState: TemplateTableState = {
  // Table state
  sorting: [],
  globalFilter: "",
  // Filter state
  cpuCount: undefined,
  memoryMB: undefined,
  isPublic: undefined,
  createdAfter: undefined,
  createdBefore: undefined,
};

export const useTemplateTableStore = create<Store>()(
  persist(
    (set) => ({
      ...initialState,

      // Table actions
      setSorting: (sorting) =>
        set((state) => ({
          sorting:
            typeof sorting === "function" ? sorting(state.sorting) : sorting,
        })),
      setGlobalFilter: (globalFilter) =>
        set((state) => ({
          globalFilter:
            typeof globalFilter === "function"
              ? globalFilter(state.globalFilter)
              : globalFilter,
        })),

      // Filter actions
      setCpuCount: (value) =>
        set((state) => ({
          cpuCount: value,
        })),
      setMemoryMB: (value) =>
        set((state) => ({
          memoryMB: value,
        })),
      setIsPublic: (value) =>
        set((state) => ({
          isPublic: value,
        })),
      setCreatedAfter: (value) =>
        set((state) => ({
          createdAfter: value,
        })),
      setCreatedBefore: (value) =>
        set((state) => ({
          createdBefore: value,
        })),

      resetFilters: () =>
        set({
          cpuCount: initialState.cpuCount,
          memoryMB: initialState.memoryMB,
          isPublic: initialState.isPublic,
          createdAfter: initialState.createdAfter,
          createdBefore: initialState.createdBefore,
          globalFilter: initialState.globalFilter,
        }),
    }),
    {
      name: "state",
      storage: createJSONStorage(() => createHashStorage(initialState)),
    },
  ),
);
