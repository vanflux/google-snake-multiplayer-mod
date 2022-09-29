import { QueryClient } from "react-query"
import { createWebStoragePersistor } from "react-query/createWebStoragePersistor-experimental"
import { persistQueryClient } from "react-query/persistQueryClient-experimental"

const cacheTime = 60 * 60 * 1000; // 1 Hour

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime,
      staleTime: cacheTime,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
});

const localStoragePersistor = createWebStoragePersistor({
  storage: window.localStorage,
});

console.log(localStoragePersistor)

persistQueryClient({
  queryClient,
  persistor: localStoragePersistor,
  maxAge: cacheTime,
  hydrateOptions: {},
  dehydrateOptions: {},
});
