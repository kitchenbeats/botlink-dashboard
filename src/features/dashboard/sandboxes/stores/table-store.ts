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
  columnFilters: ColumnFiltersState;

  // Filter state
  startedAtFilter: StartedAtFilter;
  templateId: string | undefined;
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
  setTemplateId: (id: string | undefined) => void;
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
  columnFilters: [],

  // Filter state
  startedAtFilter: undefined,
  templateId: undefined,
  cpuCount: undefined,
  memoryMB: undefined,
};

const updateColumnFilters = (state: SandboxTableState): ColumnFiltersState => {
  const filters: ColumnFiltersState = [];

  // Started At filter
  if (state.startedAtFilter) {
    const now = new Date();
    const from =
      state.startedAtFilter === "1h ago"
        ? new Date(now.getTime() - 60 * 60 * 1000)
        : state.startedAtFilter === "6h ago"
          ? new Date(now.getTime() - 6 * 60 * 60 * 1000)
          : state.startedAtFilter === "12h ago"
            ? new Date(now.getTime() - 12 * 60 * 60 * 1000)
            : undefined;

    if (from) {
      filters.push({ id: "startedAt", value: { from, to: now } });
    }
  }

  // Template filter
  if (state.templateId) {
    filters.push({ id: "template", value: state.templateId });
  }

  // CPU Usage filter
  if (state.cpuCount) {
    filters.push({ id: "cpuUsage", value: state.cpuCount });
  }

  // RAM Usage filter
  if (state.memoryMB) {
    filters.push({ id: "ramUsage", value: state.memoryMB });
  }

  return filters;
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
        const state = get();
        const newState = { ...state, startedAtFilter };
        set({
          ...newState,
          columnFilters: updateColumnFilters(newState),
        });
      },
      setTemplateId: (templateId) => {
        const state = get();
        const newState = { ...state, templateId };
        set({
          ...newState,
          columnFilters: updateColumnFilters(newState),
        });
      },
      setCpuCount: (cpuCount) => {
        const state = get();
        const newState = { ...state, cpuCount };
        set({
          ...newState,
          columnFilters: updateColumnFilters(newState),
        });
      },
      setMemoryMB: (memoryMB) => {
        const state = get();
        const newState = { ...state, memoryMB };
        set({
          ...newState,
          columnFilters: updateColumnFilters(newState),
        });
      },
      resetFilters: () => {
        const resetState = {
          ...get(),
          startedAtFilter: initialState.startedAtFilter,
          templateId: initialState.templateId,
          cpuCount: initialState.cpuCount,
          memoryMB: initialState.memoryMB,
        };
        set({
          ...resetState,
          columnFilters: updateColumnFilters(resetState),
        });
      },

      // Page actions
      setPollingInterval: (pollingInterval) =>
        set((state) => ({
          ...state,
          pollingInterval,
        })),
    }),
    {
      name: "state",
      storage: createJSONStorage(() => hashStorage),
    },
  ),
);
