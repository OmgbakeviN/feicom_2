import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// GET /feicom/api/departements/
export const fetchDepartements = createAsyncThunk("departements/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/departements/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// POST /feicom/api/departements/  { nom, agence: <id> }
export const createDepartement = createAsyncThunk("departements/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post("/feicom/api/departements/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// PUT /feicom/api/departements/{id}/  { nom, agence: <id> }
export const updateDepartement = createAsyncThunk(
  "departements/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/feicom/api/departements/${id}/`, data);
      return res.data;
    } catch (e) {
      return rejectWithValue(e?.response?.data || e?.message);
    }
  }
);

// DELETE /feicom/api/departements/{id}/
export const deleteDepartement = createAsyncThunk("departements/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/departements/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Suppression multiple (pas d’endpoint bulk)
export const deleteManyDepartements = createAsyncThunk(
  "departements/deleteMany",
  async (ids, { rejectWithValue }) => {
    try {
      await Promise.all(ids.map((id) => api.delete(`/feicom/api/departements/${id}/`)));
      return ids;
    } catch (e) {
      return rejectWithValue(e?.response?.data || e?.message);
    }
  }
);

const departementsSlice = createSlice({
  name: "departements",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDepartements.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchDepartements.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(fetchDepartements.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Erreur chargement"; })

     .addCase(createDepartement.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(createDepartement.rejected, (s, a) => { s.error = a.payload || "Erreur création"; })

     .addCase(updateDepartement.fulfilled, (s, a) => {
       const i = s.items.findIndex((x) => x.id === a.payload.id);
       if (i !== -1) s.items[i] = a.payload;
     })
     .addCase(updateDepartement.rejected, (s, a) => { s.error = a.payload || "Erreur mise à jour"; })

     .addCase(deleteDepartement.fulfilled, (s, a) => {
       s.items = s.items.filter((x) => x.id !== a.payload);
     })
     .addCase(deleteDepartement.rejected, (s, a) => { s.error = a.payload || "Erreur suppression"; })

     .addCase(deleteManyDepartements.fulfilled, (s, a) => {
       const ids = new Set(a.payload);
       s.items = s.items.filter((x) => !ids.has(x.id));
     })
     .addCase(deleteManyDepartements.rejected, (s, a) => { s.error = a.payload || "Erreur suppression multiple"; });
  },
});

export default departementsSlice.reducer;

export const selectDepartements = (s) => s.departements.items;
export const selectDepartementsLoading = (s) => s.departements.loading;
export const selectDepartementsError = (s) => s.departements.error;
