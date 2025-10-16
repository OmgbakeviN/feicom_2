import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// GET /feicom/api/agences/
export const fetchAgences = createAsyncThunk("agences/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/agences/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// POST /feicom/api/agences/
export const createAgence = createAsyncThunk("agences/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post("/feicom/api/agences/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// PUT /feicom/api/agences/{id}/
export const updateAgence = createAsyncThunk("agences/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/feicom/api/agences/${id}/`, data);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// DELETE /feicom/api/agences/{id}/
export const deleteAgence = createAsyncThunk("agences/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/agences/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// suppression multiple (pas d’endpoint bulk → on boucle côté client)
export const deleteManyAgences = createAsyncThunk("agences/deleteMany", async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map((id) => api.delete(`/feicom/api/agences/${id}/`)));
    return ids;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

const agencesSlice = createSlice({
  name: "agences",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAgences.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchAgences.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(fetchAgences.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Erreur chargement"; })

     .addCase(createAgence.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(createAgence.rejected, (s, a) => { s.error = a.payload || "Erreur création"; })

     .addCase(updateAgence.fulfilled, (s, a) => {
       const i = s.items.findIndex((x) => x.id === a.payload.id);
       if (i !== -1) s.items[i] = a.payload;
     })
     .addCase(updateAgence.rejected, (s, a) => { s.error = a.payload || "Erreur mise à jour"; })

     .addCase(deleteAgence.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload); })
     .addCase(deleteAgence.rejected, (s, a) => { s.error = a.payload || "Erreur suppression"; })

     .addCase(deleteManyAgences.fulfilled, (s, a) => {
       const ids = new Set(a.payload);
       s.items = s.items.filter((x) => !ids.has(x.id));
     })
     .addCase(deleteManyAgences.rejected, (s, a) => { s.error = a.payload || "Erreur suppression multiple"; });
  },
});

export default agencesSlice.reducer;

export const selectAgences = (s) => s.agences.items;
export const selectAgencesLoading = (s) => s.agences.loading;
export const selectAgencesError = (s) => s.agences.error;
