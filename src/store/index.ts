import { configureStore } from "@reduxjs/toolkit";

import { workspaceApi } from "@/store/workspace-api";

export function makeStore() {
  return configureStore({
    reducer: {
      [workspaceApi.reducerPath]: workspaceApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(workspaceApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
export type RootState = ReturnType<AppStore["getState"]>;
