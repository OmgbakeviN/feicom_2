import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// Liste
export const fetchExercices = createAsyncThunk("exercices/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/exercices/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Création { budget, annee, taux_consomme, pourcentage_consomme }
export const createExercice = createAsyncThunk("exercices/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post("/feicom/api/exercices/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Mise à jour
export const updateExercice = createAsyncThunk("exercices/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/feicom/api/exercices/${id}/`, data);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Suppression
export const deleteExercice = createAsyncThunk("exercices/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/exercices/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// Suppression multiple
export const deleteManyExercices = createAsyncThunk("exercices/deleteMany", async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map(id => api.delete(`/feicom/api/exercices/${id}/`)));
    return ids;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

const exercicesSlice = createSlice({
  name: "exercices",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchExercices.pending, (s)=>{ s.loading=true; s.error=null; })
     .addCase(fetchExercices.fulfilled,(s,a)=>{ s.loading=false; s.items=a.payload; })
     .addCase(fetchExercices.rejected,(s,a)=>{ s.loading=false; s.error=a.payload||"Erreur chargement"; })

     .addCase(createExercice.fulfilled,(s,a)=>{ s.items.unshift(a.payload); })
     .addCase(createExercice.rejected,(s,a)=>{ s.error=a.payload||"Erreur création"; })

     .addCase(updateExercice.fulfilled,(s,a)=>{ const i=s.items.findIndex(x=>x.id===a.payload.id); if(i!==-1) s.items[i]=a.payload; })
     .addCase(updateExercice.rejected,(s,a)=>{ s.error=a.payload||"Erreur mise à jour"; })

     .addCase(deleteExercice.fulfilled,(s,a)=>{ s.items=s.items.filter(x=>x.id!==a.payload); })
     .addCase(deleteExercice.rejected,(s,a)=>{ s.error=a.payload||"Erreur suppression"; })

     .addCase(deleteManyExercices.fulfilled,(s,a)=>{ const ids=new Set(a.payload); s.items=s.items.filter(x=>!ids.has(x.id)); })
     .addCase(deleteManyExercices.rejected,(s,a)=>{ s.error=a.payload||"Erreur suppression multiple"; });
  },
});

export default exercicesSlice.reducer;
export const selectExercices = (s)=>s.exercices.items;
export const selectExercicesLoading = (s)=>s.exercices.loading;
export const selectExercicesError = (s)=>s.exercices.error;
