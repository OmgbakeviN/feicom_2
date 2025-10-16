import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// GET /feicom/api/projets/
export const fetchProjets = createAsyncThunk("projets/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/projets/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) { return rejectWithValue(e?.response?.data || e?.message); }
});

// POST /feicom/api/projets/
export const createProjet = createAsyncThunk("projets/create", async (payload, { rejectWithValue }) => {
  try { const res = await api.post("/feicom/api/projets/", payload); return res.data; }
  catch (e) { return rejectWithValue(e?.response?.data || e?.message); }
});

// PUT /feicom/api/projets/{id}/
export const updateProjet = createAsyncThunk("projets/update", async ({ id, data }, { rejectWithValue }) => {
  try { const res = await api.put(`/feicom/api/projets/${id}/`, data); return res.data; }
  catch (e) { return rejectWithValue(e?.response?.data || e?.message); }
});

// DELETE /feicom/api/projets/{id}/
export const deleteProjet = createAsyncThunk("projets/deleteOne", async (id, { rejectWithValue }) => {
  try { await api.delete(`/feicom/api/projets/${id}/`); return id; }
  catch (e) { return rejectWithValue(e?.response?.data || e?.message); }
});

// delete many (boucle)
export const deleteManyProjets = createAsyncThunk("projets/deleteMany", async (ids, { rejectWithValue }) => {
  try { await Promise.all(ids.map(id => api.delete(`/feicom/api/projets/${id}/`))); return ids; }
  catch (e) { return rejectWithValue(e?.response?.data || e?.message); }
});

const projetsSlice = createSlice({
  name: "projets",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchProjets.pending, (s)=>{ s.loading=true; s.error=null; })
     .addCase(fetchProjets.fulfilled, (s,a)=>{ s.loading=false; s.items=a.payload; })
     .addCase(fetchProjets.rejected, (s,a)=>{ s.loading=false; s.error=a.payload || "Erreur chargement"; })

     .addCase(createProjet.fulfilled, (s,a)=>{ s.items.unshift(a.payload); })
     .addCase(updateProjet.fulfilled, (s,a)=>{ const i=s.items.findIndex(x=>x.id===a.payload.id); if(i!==-1) s.items[i]=a.payload; })
     .addCase(deleteProjet.fulfilled, (s,a)=>{ s.items=s.items.filter(x=>x.id!==a.payload); })
     .addCase(deleteManyProjets.fulfilled, (s,a)=>{ const ids=new Set(a.payload); s.items=s.items.filter(x=>!ids.has(x.id)); });
  },
});

export default projetsSlice.reducer;
export const selectProjets = s => s.projets.items;
export const selectProjetsLoading = s => s.projets.loading;
export const selectProjetsError = s => s.projets.error;
