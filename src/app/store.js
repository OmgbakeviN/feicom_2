import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// typescript pas nécessaire; en JS on peut exporter des helpers si besoin plus tard
