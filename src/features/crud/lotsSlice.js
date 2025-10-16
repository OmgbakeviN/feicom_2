// /feicom/api/lots/  (GET liste) ; POST/PUT { nom, statut, montant, pourcentage, projet }
// DELETE /feicom/api/lots/{id}/
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export const fetchLots = createAsyncThunk("lots/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/lots/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const createLot = createAsyncThunk("lots/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post("/feicom/api/lots/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const updateLot = createAsyncThunk("lots/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/feicom/api/lots/${id}/`, data);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const deleteLot = createAsyncThunk("lots/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/lots/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const deleteManyLots = createAsyncThunk("lots/deleteMany", async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map((id) => api.delete(`/feicom/api/lots/${id}/`)));
    return ids;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

const lotsSlice = createSlice({
  name: "lots",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchLots.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchLots.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(fetchLots.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Erreur chargement"; })

     .addCase(createLot.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(createLot.rejected, (s, a) => { s.error = a.payload || "Erreur création"; })

     .addCase(updateLot.fulfilled, (s, a) => {
       const i = s.items.findIndex((x) => x.id === a.payload.id);
       if (i !== -1) s.items[i] = a.payload;
     })
     .addCase(updateLot.rejected, (s, a) => { s.error = a.payload || "Erreur mise à jour"; })

     .addCase(deleteLot.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload); })
     .addCase(deleteLot.rejected, (s, a) => { s.error = a.payload || "Erreur suppression"; })

     .addCase(deleteManyLots.fulfilled, (s, a) => {
       const ids = new Set(a.payload);
       s.items = s.items.filter((x) => !ids.has(x.id));
     })
     .addCase(deleteManyLots.rejected, (s, a) => { s.error = a.payload || "Erreur suppression multiple"; });
  },
});

export default lotsSlice.reducer;
export const selectLots = (s) => s.lots.items;
export const selectLotsLoading = (s) => s.lots.loading;
export const selectLotsError = (s) => s.lots.error;
