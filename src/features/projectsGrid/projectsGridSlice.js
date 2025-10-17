// Gère les filtres serveur et les données "grid":
// - Quand exercice+agence (+mois optionnel) => on utilise l'API filters.
// - Sinon on retombe sur la liste complète (déjà chargée via projetsSlice).

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// Thunk: charge selon les filtres
export const fetchProjectsByFilters = createAsyncThunk(
  "projectsGrid/fetchByFilters",
  async ({ exerciceId, agenceId, month }, { rejectWithValue }) => {
    try {
      if (!exerciceId || !agenceId) {
        // Pas assez d'infos pour appel serveur: on renverra [] et le composant s'appuiera sur projetsSlice
        return { fromServer: false, items: [] };
      }
      // Avec mois ?
      if (month) {
        const url = `/feicom/api/filters/projects/${Number(exerciceId)}/${Number(agenceId)}/${Number(month)}/`;
        const res = await api.get(url);
        const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
        return { fromServer: true, items: list };
      }
      // Sans mois
      const url = `/feicom/api/filters/projects/${Number(exerciceId)}/${Number(agenceId)}/`;
      const res = await api.get(url);
      const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      return { fromServer: true, items: list };
    } catch (e) {
      return rejectWithValue(e?.response?.data || e?.message);
    }
  }
);

const projectsGridSlice = createSlice({
  name: "projectsGrid",
  initialState: {
    loading: false,
    error: null,
    // Données éventuellement renvoyées par /filters/… ; sinon on utilisera projetsSlice côté UI
    serverItems: [],
    fromServer: false,
    // Filtres UI (persistés dans Redux pour simplicité)
    filters: {
      exercice: "",  // id
      agence: "",    // id (masqué et forcé si REGIONAL)
      month: "",     // 1..12
      communes: [],  // [ids]
      search: "",    // texte
    },
  },
  reducers: {
    setFilters(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
    resetFilters(state, { payload: defaultAgence }) {
      state.filters = {
        exercice: "",
        agence: defaultAgence || "",
        month: "",
        communes: [],
        search: "",
      };
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchProjectsByFilters.pending, (s) => {
      s.loading = true; s.error = null; s.fromServer = false; s.serverItems = [];
    });
    b.addCase(fetchProjectsByFilters.fulfilled, (s, a) => {
      s.loading = false;
      s.fromServer = a.payload.fromServer;
      s.serverItems = a.payload.items;
    });
    b.addCase(fetchProjectsByFilters.rejected, (s, a) => {
      s.loading = false; s.error = a.payload || "Erreur chargement filtres";
      s.fromServer = false; s.serverItems = [];
    });
  },
});

export const { setFilters, resetFilters } = projectsGridSlice.actions;

export const selectGridFilters = (s) => s.projectsGrid.filters;
export const selectGridLoading = (s) => s.projectsGrid.loading;
export const selectGridError = (s) => s.projectsGrid.error;
export const selectGridServerItems = (s) => s.projectsGrid.serverItems;
export const selectGridFromServer = (s) => s.projectsGrid.fromServer;

export default projectsGridSlice.reducer;
