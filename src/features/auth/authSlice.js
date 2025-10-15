import { createSlice } from "@reduxjs/toolkit";

const tokenFromStorage = (() => {
  try { return localStorage.getItem("token"); } catch { return null; }
})();

const userFromStorage = (() => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
})();

const initialState = {
  token: tokenFromStorage,
  user: userFromStorage,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.token = payload?.token ?? null;
      state.user = payload?.user ?? null;
      try {
        if (state.token) localStorage.setItem("token", state.token);
        else localStorage.removeItem("token");
        localStorage.setItem("user", JSON.stringify(state.user));
      } catch {}
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {}
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
