import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import { OnChangeFn, SortingState } from "@tanstack/react-table";

const hashStorage: StateStorage = {
  getItem: (key): string => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    const storedValue = searchParams.get(key) ?? "";
    return JSON.parse(storedValue);
  },
  setItem: (key, newValue): void => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.set(key, JSON.stringify(newValue));
    window.location.hash = searchParams.toString();
  },
  removeItem: (key): void => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1));
    searchParams.delete(key);
    window.location.hash = searchParams.toString();
  },
};

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
          ...state,
          sorting:
            typeof sorting === "function" ? sorting(state.sorting) : sorting,
        })),
      setGlobalFilter: (globalFilter) =>
        set((state) => ({
          ...state,
          globalFilter:
            typeof globalFilter === "function"
              ? globalFilter(state.globalFilter)
              : globalFilter,
        })),

      // Filter actions
      setCpuCount: (value) =>
        set((state) => ({
          ...state,
          cpuCount: value,
        })),
      setMemoryMB: (value) =>
        set((state) => ({
          ...state,
          memoryMB: value,
        })),
      setIsPublic: (value) =>
        set((state) => ({
          ...state,
          isPublic: value,
        })),
      setCreatedAfter: (value) =>
        set((state) => ({
          ...state,
          createdAfter: value,
        })),
      setCreatedBefore: (value) =>
        set((state) => ({
          ...state,
          createdBefore: value,
        })),
    }),
    {
      name: "state",
      storage: createJSONStorage(() => hashStorage),
    },
  ),
);
