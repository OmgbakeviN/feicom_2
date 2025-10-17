import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import agencesReducer from "@/features/crud/agencesSlice";
import communesReducer from "@/features/crud/communesSlice";
import departementsReducer from "@/features/crud/departementsSlice";
import entreprisesReducer from "@/features/crud/entreprisesSlice";
import exercicesReducer from "@/features/crud/exercicesSlice";
import lotsReducer from "@/features/crud/lotsSlice";
import todosReducer from "@/features/crud/todosSlice";
import visitesReducer from "@/features/crud/visitesSlice";
import projetsReducer from "@/features/crud/projetsSlice";
import projectsGridReducer from "@/features/projectsGrid/projectsGridSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    agences: agencesReducer,
    communes: communesReducer,
    departements: departementsReducer,
    entreprises: entreprisesReducer,
    exercices: exercicesReducer,
    lots: lotsReducer,
    todos: todosReducer,
    visites: visitesReducer,
    projets: projetsReducer,
    projectsGrid: projectsGridReducer,
  },
});

// typescript pas nécessaire; en JS on peut exporter des helpers si besoin plus tard
