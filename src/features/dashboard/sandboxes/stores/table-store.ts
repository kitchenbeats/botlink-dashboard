import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { StartedAtFilter } from "../table-filters";
import { PollingInterval } from "@/types/dashboard";

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

interface SandboxTableState {
  // Page state
  pollingInterval: PollingInterval;

  // Table state
  sorting: SortingState;
  globalFilter: string;
  pagination: PaginationState;

  // Filter state
  startedAtFilter: StartedAtFilter;
  templateIds: string[];
  cpuCount: number | undefined;
  memoryMB: number | undefined;
}

interface SandboxTableActions {
  // Table actions
  setSorting: OnChangeFn<SortingState>;
  setGlobalFilter: OnChangeFn<string>;
  setPagination: OnChangeFn<PaginationState>;

  // Filter actions
  setStartedAtFilter: (filter: StartedAtFilter) => void;
  setTemplateIds: (ids: string[]) => void;
  setCpuCount: (count: number | undefined) => void;
  setMemoryMB: (mb: number | undefined) => void;
  resetFilters: () => void;

  // Page actions
  setPollingInterval: (interval: PollingInterval) => void;
}

type Store = SandboxTableState & SandboxTableActions;

const initialState: SandboxTableState = {
  // Page state
  pollingInterval: 60, // 1 minute

  // Table state
  sorting: [],
  globalFilter: "",
  pagination: {
    pageIndex: 0,
    pageSize: 50,
  },

  // Filter state
  startedAtFilter: undefined,
  templateIds: [],
  cpuCount: undefined,
  memoryMB: undefined,
};

export const useSandboxTableStore = create<Store>()(
  persist(
    (set, get) => ({
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
      setPagination: (pagination) =>
        set((state) => ({
          ...state,
          pagination:
            typeof pagination === "function"
              ? pagination(state.pagination)
              : pagination,
        })),

      // Filter actions
      setStartedAtFilter: (startedAtFilter) => {
        set({
          startedAtFilter,
        });
      },
      setTemplateIds: (templateIds) => {
        set({
          templateIds,
        });
      },
      setCpuCount: (cpuCount) => {
        set({
          cpuCount,
        });
      },
      setMemoryMB: (memoryMB) => {
        set({
          memoryMB,
        });
      },
      resetFilters: () => {
        set({
          startedAtFilter: initialState.startedAtFilter,
          templateIds: initialState.templateIds,
          cpuCount: initialState.cpuCount,
          memoryMB: initialState.memoryMB,
        });
      },

      // Page actions
      setPollingInterval: (pollingInterval) =>
        set({
          pollingInterval,
        }),
    }),
    {
      name: "state",
      storage: createJSONStorage(() => hashStorage),
    },
  ),
);
