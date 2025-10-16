// CRUD Communes: /feicom/api/communes/
// GET:    [{ id, nom, departement: { id, nom, agence: {...} } }, ...]
// POST:   { nom, departement: <id> }
// PUT:    { nom, departement: <id> }
// DELETE: /feicom/api/communes/{id}/
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// Liste
export const fetchCommunes = createAsyncThunk("communes/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/communes/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Création
export const createCommune = createAsyncThunk("communes/create", async (payload, { rejectWithValue }) => {
  try {
    // payload attendu: { nom, departement: <id> }
    const res = await api.post("/feicom/api/communes/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Mise à jour
export const updateCommune = createAsyncThunk("communes/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/feicom/api/communes/${id}/`, data);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Suppression
export const deleteCommune = createAsyncThunk("communes/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/communes/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Suppression multiple (boucle côté client)
export const deleteManyCommunes = createAsyncThunk("communes/deleteMany", async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map(id => api.delete(`/feicom/api/communes/${id}/`)));
    return ids;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

const communesSlice = createSlice({
  name: "communes",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCommunes.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchCommunes.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(fetchCommunes.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Erreur chargement"; })

     .addCase(createCommune.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(createCommune.rejected, (s, a) => { s.error = a.payload || "Erreur création"; })

     .addCase(updateCommune.fulfilled, (s, a) => {
       const i = s.items.findIndex(x => x.id === a.payload.id);
       if (i !== -1) s.items[i] = a.payload;
     })
     .addCase(updateCommune.rejected, (s, a) => { s.error = a.payload || "Erreur mise à jour"; })

     .addCase(deleteCommune.fulfilled, (s, a) => { s.items = s.items.filter(x => x.id !== a.payload); })
     .addCase(deleteCommune.rejected, (s, a) => { s.error = a.payload || "Erreur suppression"; })

     .addCase(deleteManyCommunes.fulfilled, (s, a) => {
       const ids = new Set(a.payload);
       s.items = s.items.filter(x => !ids.has(x.id));
     })
     .addCase(deleteManyCommunes.rejected, (s, a) => { s.error = a.payload || "Erreur suppression multiple"; });
  },
});

export default communesSlice.reducer;
export const selectCommunes = s => s.communes.items;
export const selectCommunesLoading = s => s.communes.loading;
export const selectCommunesError = s => s.communes.error;
