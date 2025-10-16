import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchTodos, createTodo, updateTodo, deleteTodo, deleteManyTodos,
  selectTodos, selectTodosLoading, selectTodosError
} from "@/features/crud/todosSlice";

import { fetchLots, selectLots } from "@/features/crud/lotsSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fmtDate = (s) => (s ? String(s).split("T")[0] : "");
const STATUTS = ["NOT STARTED", "IN PROGRESS", "PAUSED", "DONE"];

// --- Formulaire (Ajout / Edition) ---
function TodoForm({ initialData = {}, lots = [], onSave, onCancel, loading }) {
  const [nom, setNom] = useState(initialData.nom || "");
  const [statut, setStatut] = useState(initialData.statut || "NOT STARTED");
  const [lotId, setLotId] = useState(initialData.lot || "");

  useEffect(() => {
    setNom(initialData.nom || "");
    setStatut(initialData.statut || "NOT STARTED");
    setLotId(initialData.lot || "");
  }, [initialData?.id]);

  const submit = (e) => {
    e.preventDefault();
    onSave({ nom, statut, lot: Number(lotId) });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="nom">Nom du Todo</Label>
        <Input id="nom" value={nom} onChange={(e)=>setNom(e.target.value)} required />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="statut">Statut</Label>
          <select id="statut" className="w-full rounded-md border px-3 py-2" value={statut} onChange={(e)=>setStatut(e.target.value)}>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lot">Lot</Label>
          <select id="lot" className="w-full rounded-md border px-3 py-2" value={lotId} onChange={(e)=>setLotId(e.target.value)} required>
            <option value="" disabled>Sélectionner un lot</option>
            {lots.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </select>
        </div>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Valider"}</Button>
      </DialogFooter>
    </form>
  );
}

// --- Confirmation suppression ---
function DeleteConfirm({ names = [], onConfirm, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <p>Voulez-vous vraiment supprimer {names.length > 1 ? "les todos suivants" : "le todo suivant"} ?</p>
      <p className="text-sm"><b>{names.join(", ")}</b></p>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
          {loading ? "Suppression..." : "Supprimer"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function TodosTable() {
  const dispatch = useDispatch();

  const todos = useSelector(selectTodos);
  const loading = useSelector(selectTodosLoading);
  const error = useSelector(selectTodosError);

  // lots pour afficher le nom et pour le <select>
  const lots = useSelector(selectLots);

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [node, setNode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchTodos());
    // s'il n'y a pas encore les lots en mémoire, on les récupère
    if (!lots || lots.length === 0) dispatch(fetchLots());
  }, [dispatch]);

  // helper: map lotId -> lotNom (depuis le store)
  const lotNameById = useMemo(() => {
    const map = new Map();
    (lots || []).forEach((l) => map.set(l.id, l.nom));
    return (id) => map.get(id) || `Lot #${id}`;
  }, [lots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return todos;
    const f = (v) => (v ?? "").toString().toLowerCase().includes(q);
    return todos.filter((r) => f(r.nom) || f(r.statut) || f(lotNameById(r.lot)));
  }, [todos, search, lotNameById]);

  const onSelect = useCallback((state) => setSelectedRows(state.selectedRows), []);

  // --- Actions → Dialogs ---
  const onAdd = () => {
    setTitle("Ajouter un Todo");
    setNode(
      <TodoForm
        lots={lots}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(createTodo(form)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onEdit = (row) => {
    setTitle("Modifier le Todo");
    setNode(
      <TodoForm
        initialData={row}
        lots={lots}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(updateTodo({ id: row.id, data: form })).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteOne = (row) => {
    setTitle("Supprimer le Todo");
    setNode(
      <DeleteConfirm
        names={[row.nom]}
        onConfirm={async () => {
          setBusy(true);
          try { await dispatch(deleteTodo(row.id)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteMany = () => {
    const ids = selectedRows.map((r) => r.id);
    const names = selectedRows.map((r) => r.nom);
    setTitle("Supprimer la sélection");
    setNode(
      <DeleteConfirm
        names={names}
        onConfirm={async () => {
          setBusy(true);
          try {
            await dispatch(deleteManyTodos(ids)).unwrap();
            setClearSelToggle((v) => !v);
            setOpen(false);
          } finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  // Colonnes (affiche le **nom du lot** via le store)
  const columns = [
    { name: "Nom", selector: (r) => r.nom, sortable: true, wrap: true },
    { name: "Statut", selector: (r) => r.statut, sortable: true, width: "160px" },
    { name: "Lot", selector: (r) => lotNameById(r.lot), sortable: true, wrap: true },
    { name: "Créé le", selector: (r) => fmtDate(r.created_at), sortable: true, width: "120px" },
    { name: "MAJ le", selector: (r) => fmtDate(r.updated_at), sortable: true, width: "120px" },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={() => onDeleteOne(row)}>Supprimer</Button>
        </div>
      ),
      button: true,
      ignoreRowClick: true,
      width: "240px",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Todos</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Recherche (nom / statut / lot)" className="w-80" onChange={(e)=>setSearch(e.target.value)} />
            <Button onClick={onAdd}>Ajouter</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {String(error)}
            </div>
          )}

          {selectedRows.length > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-md border bg-zinc-50 p-3">
              <div className="text-sm text-zinc-600">
                Supprimer la sélection ({selectedRows.length})
              </div>
              <Button variant="destructive" onClick={onDeleteMany}>Supprimer</Button>
            </div>
          )}

          <DataTable
            data={filtered}
            columns={columns}
            pagination
            selectableRows
            onSelectedRowsChange={onSelect}
            clearSelectedRows={clearSelToggle}
            progressPending={loading}
            noDataComponent="Aucune donnée"
            striped
            dense
          />
        </CardContent>
      </Card>

      {/* Dialog pour toutes les opérations */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="pt-2">{node}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
