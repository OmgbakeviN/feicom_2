import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import agencesReducer from "@/features/crud/agencesSlice";
import communesReducer from "@/features/crud/communesSlice";
import departementsReducer from "@/features/crud/departementsSlice";
import entreprisesReducer from "@/features/crud/entreprisesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    agences: agencesReducer,
    communes: communesReducer,
    departements: departementsReducer,
    entreprises: entreprisesReducer,
  },
});

// typescript pas nécessaire; en JS on peut exporter des helpers si besoin plus tard
