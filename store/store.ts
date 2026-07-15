import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer, { logout } from "./reducers/authReducer";
import cartReducer from "./reducers/cartReducer";
// import filtersReducer from "./reducers/filtersReducer";
import { baseApi } from "./baseApi";

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: logout.match,
  effect: (_action, api) => {
    api.dispatch(baseApi.util.resetApiState());
  },
});

const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    authReducer,
    cartReducer,
    // filters: filtersReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(baseApi.middleware),
});

setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export default store;
