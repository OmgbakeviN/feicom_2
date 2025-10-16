// CRUD Entreprises: /feicom/api/entreprises/
// Champs: id, nom, rcc, niu, promoteur, contact, email, siege_social, created_at, updated_at
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// Liste
export const fetchEntreprises = createAsyncThunk("entreprises/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/entreprises/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Création
export const createEntreprise = createAsyncThunk("entreprises/create", async (payload, { rejectWithValue }) => {
  try {
    // payload: { nom, rcc, niu, promoteur, contact, email, siege_social }
    const res = await api.post("/feicom/api/entreprises/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Mise à jour
export const updateEntreprise = createAsyncThunk("entreprises/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/feicom/api/entreprises/${id}/`, data);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Suppression
export const deleteEntreprise = createAsyncThunk("entreprises/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/entreprises/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Suppression multiple (pas d’endpoint bulk)
export const deleteManyEntreprises = createAsyncThunk("entreprises/deleteMany", async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map((id) => api.delete(`/feicom/api/entreprises/${id}/`)));
    return ids;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

const entreprisesSlice = createSlice({
  name: "entreprises",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchEntreprises.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchEntreprises.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(fetchEntreprises.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Erreur chargement"; })

     .addCase(createEntreprise.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(createEntreprise.rejected, (s, a) => { s.error = a.payload || "Erreur création"; })

     .addCase(updateEntreprise.fulfilled, (s, a) => {
       const i = s.items.findIndex((x) => x.id === a.payload.id);
       if (i !== -1) s.items[i] = a.payload;
     })
     .addCase(updateEntreprise.rejected, (s, a) => { s.error = a.payload || "Erreur mise à jour"; })

     .addCase(deleteEntreprise.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload); })
     .addCase(deleteEntreprise.rejected, (s, a) => { s.error = a.payload || "Erreur suppression"; })

     .addCase(deleteManyEntreprises.fulfilled, (s, a) => {
       const ids = new Set(a.payload);
       s.items = s.items.filter((x) => !ids.has(x.id));
     })
     .addCase(deleteManyEntreprises.rejected, (s, a) => { s.error = a.payload || "Erreur suppression multiple"; });
  },
});

export default entreprisesSlice.reducer;

export const selectEntreprises = (s) => s.entreprises.items;
export const selectEntreprisesLoading = (s) => s.entreprises.loading;
export const selectEntreprisesError = (s) => s.entreprises.error;
