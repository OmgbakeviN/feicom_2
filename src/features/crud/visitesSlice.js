// /feicom/api/visites/ :
// GET -> tableau d'objets (voir ton exemple)
// POST/PUT -> on enverra les champs de base (date, projet, observation, payment_percent)
// DELETE -> /feicom/api/visites/{id}/
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export const fetchVisites = createAsyncThunk("visites/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/visites/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const createVisite = createAsyncThunk("visites/create", async (payload, { rejectWithValue }) => {
  try {
    // payload attendu (minimal) : { date, projet: <id>, observation, payment_percent }
    const res = await api.post("/feicom/api/visites/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const updateVisite = createAsyncThunk("visites/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/feicom/api/visites/${id}/`, data);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const deleteVisite = createAsyncThunk("visites/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/visites/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

export const deleteManyVisites = createAsyncThunk("visites/deleteMany", async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map((id) => api.delete(`/feicom/api/visites/${id}/`)));
    return ids;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

const visitesSlice = createSlice({
  name: "visites",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchVisites.pending,  (s) => { s.loading = true; s.error = null; })
     .addCase(fetchVisites.fulfilled,(s,a)=> { s.loading = false; s.items = a.payload; })
     .addCase(fetchVisites.rejected, (s,a)=> { s.loading = false; s.error = a.payload || "Erreur chargement"; })

     .addCase(createVisite.fulfilled,(s,a)=> { s.items.unshift(a.payload); })
     .addCase(createVisite.rejected, (s,a)=> { s.error = a.payload || "Erreur création"; })

     .addCase(updateVisite.fulfilled,(s,a)=> { const i=s.items.findIndex(x=>x.id===a.payload.id); if(i!==-1) s.items[i]=a.payload; })
     .addCase(updateVisite.rejected, (s,a)=> { s.error = a.payload || "Erreur mise à jour"; })

     .addCase(deleteVisite.fulfilled,(s,a)=> { s.items = s.items.filter(x=>x.id!==a.payload); })
     .addCase(deleteVisite.rejected, (s,a)=> { s.error = a.payload || "Erreur suppression"; })

     .addCase(deleteManyVisites.fulfilled,(s,a)=> { const ids=new Set(a.payload); s.items = s.items.filter(x=>!ids.has(x.id)); })
     .addCase(deleteManyVisites.rejected, (s,a)=> { s.error = a.payload || "Erreur suppression multiple"; });
  },
});

export default visitesSlice.reducer;
export const selectVisites = (s) => s.visites.items;
export const selectVisitesLoading = (s) => s.visites.loading;
export const selectVisitesError = (s) => s.visites.error;
