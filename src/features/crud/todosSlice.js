import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/lib/axios";

// GET /feicom/api/todos/
export const fetchTodos = createAsyncThunk("todos/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/feicom/api/todos/");
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// POST /feicom/api/todos/   { nom, statut, lot:<id> }
export const createTodo = createAsyncThunk("todos/create", async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post("/feicom/api/todos/", payload);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// PUT /feicom/api/todos/{id}/
export const updateTodo = createAsyncThunk("todos/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/feicom/api/todos/${id}/`, data);
    return res.data;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// DELETE /feicom/api/todos/{id}/
export const deleteTodo = createAsyncThunk("todos/deleteOne", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/feicom/api/todos/${id}/`);
    return id;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

// DELETE many (boucle)
export const deleteManyTodos = createAsyncThunk("todos/deleteMany", async (ids, { rejectWithValue }) => {
  try {
    await Promise.all(ids.map((id) => api.delete(`/feicom/api/todos/${id}/`)));
    return ids;
  } catch (e) {
    return rejectWithValue(e?.response?.data || e?.message);
  }
});

const todosSlice = createSlice({
  name: "todos",
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTodos.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchTodos.fulfilled, (s, a) => { s.loading = false; s.items = a.payload; })
     .addCase(fetchTodos.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Erreur chargement"; })

     .addCase(createTodo.fulfilled, (s, a) => { s.items.unshift(a.payload); })
     .addCase(createTodo.rejected, (s, a) => { s.error = a.payload || "Erreur création"; })

     .addCase(updateTodo.fulfilled, (s, a) => {
       const i = s.items.findIndex((x) => x.id === a.payload.id);
       if (i !== -1) s.items[i] = a.payload;
     })
     .addCase(updateTodo.rejected, (s, a) => { s.error = a.payload || "Erreur mise à jour"; })

     .addCase(deleteTodo.fulfilled, (s, a) => { s.items = s.items.filter((x) => x.id !== a.payload); })
     .addCase(deleteTodo.rejected, (s, a) => { s.error = a.payload || "Erreur suppression"; })

     .addCase(deleteManyTodos.fulfilled, (s, a) => {
       const ids = new Set(a.payload);
       s.items = s.items.filter((x) => !ids.has(x.id));
     })
     .addCase(deleteManyTodos.rejected, (s, a) => { s.error = a.payload || "Erreur suppression multiple"; });
  },
});

export default todosSlice.reducer;
export const selectTodos = (s) => s.todos.items;
export const selectTodosLoading = (s) => s.todos.loading;
export const selectTodosError = (s) => s.todos.error;
