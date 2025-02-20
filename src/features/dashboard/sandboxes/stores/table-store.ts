import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  OnChangeFn,
  RowPinningState,
  SortingState,
} from '@tanstack/react-table'
import { StartedAtFilter } from '../table-filters'
import { PollingInterval } from '@/types/dashboard'
import { createHashStorage } from '@/lib/utils/store'

interface SandboxTableState {
  // Page state
  pollingInterval: PollingInterval

  // Table state
  sorting: SortingState
  globalFilter: string
  rowPinning: RowPinningState

  // Filter state
  startedAtFilter: StartedAtFilter
  templateIds: string[]
  cpuCount: number | undefined
  memoryMB: number | undefined
}

interface SandboxTableActions {
  // Table actions
  setSorting: OnChangeFn<SortingState>
  setGlobalFilter: OnChangeFn<string>
  setRowPinning: OnChangeFn<RowPinningState>

  // Filter actions
  setStartedAtFilter: (filter: StartedAtFilter) => void
  setTemplateIds: (ids: string[]) => void
  setCpuCount: (count: number | undefined) => void
  setMemoryMB: (mb: number | undefined) => void
  resetFilters: () => void

  // Page actions
  setPollingInterval: (interval: PollingInterval) => void
}

type Store = SandboxTableState & SandboxTableActions

const initialState: SandboxTableState = {
  // Page state
  pollingInterval: 60, // 1 minute

  // Table state
  sorting: [],
  globalFilter: '',
  rowPinning: {},

  // Filter state
  startedAtFilter: undefined,
  templateIds: [],
  cpuCount: undefined,
  memoryMB: undefined,
}

export const useSandboxTableStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Table actions
      setSorting: (sorting) =>
        set((state) => ({
          ...state,
          sorting:
            typeof sorting === 'function' ? sorting(state.sorting) : sorting,
        })),
      setGlobalFilter: (globalFilter) =>
        set((state) => ({
          ...state,
          globalFilter:
            typeof globalFilter === 'function'
              ? globalFilter(state.globalFilter)
              : globalFilter,
        })),
      setRowPinning: (rowPinning) =>
        set((state) => ({
          ...state,
          rowPinning:
            typeof rowPinning === 'function'
              ? rowPinning(state.rowPinning)
              : rowPinning,
        })),

      // Filter actions
      setStartedAtFilter: (startedAtFilter) => {
        set({
          startedAtFilter,
        })
      },
      setTemplateIds: (templateIds) => {
        set({
          templateIds,
        })
      },
      setCpuCount: (cpuCount) => {
        set({
          cpuCount,
        })
      },
      setMemoryMB: (memoryMB) => {
        set({
          memoryMB,
        })
      },
      resetFilters: () => {
        set({
          startedAtFilter: initialState.startedAtFilter,
          templateIds: initialState.templateIds,
          cpuCount: initialState.cpuCount,
          memoryMB: initialState.memoryMB,
          globalFilter: initialState.globalFilter,
        })
      },

      // Page actions
      setPollingInterval: (pollingInterval) =>
        set({
          pollingInterval,
        }),
    }),
    {
      name: 'state',
      storage: createJSONStorage(() =>
        createHashStorage<SandboxTableState>(initialState)
      ),
    }
  )
)
