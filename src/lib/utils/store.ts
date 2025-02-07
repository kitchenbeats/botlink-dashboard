import { StateStorage } from 'zustand/middleware'

export const createHashStorage = <T extends object>(
  initialState: T
): StateStorage => ({
  getItem: (key): string => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1))
    const storedValue = searchParams.get(key)
    if (!storedValue) {
      return JSON.stringify({
        state: initialState,
        version: 0,
      })
    }
    return storedValue
  },
  setItem: (key, newValue): void => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1))
    const persistedData = JSON.parse(newValue)
    const stateValue = persistedData.state as T

    const stateToStore: Partial<T> = {}
    ;(Object.entries(stateValue) as [keyof T, unknown][]).forEach(([k, v]) => {
      if (JSON.stringify(v) !== JSON.stringify(initialState[k])) {
        stateToStore[k] = v as T[keyof T]
      }
    })

    if (Object.keys(stateToStore).length > 0) {
      searchParams.set(
        key,
        JSON.stringify({
          state: stateToStore,
          version: persistedData.version,
        })
      )
    } else {
      searchParams.delete(key)
    }

    window.location.hash = searchParams.toString()
  },
  removeItem: (key): void => {
    const searchParams = new URLSearchParams(window.location.hash.slice(1))
    searchParams.delete(key)
    window.location.hash = searchParams.toString()
  },
})
