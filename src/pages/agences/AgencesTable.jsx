import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAgences, createAgence, updateAgence, deleteAgence, deleteManyAgences,
  selectAgences, selectAgencesLoading, selectAgencesError
} from "@/features/crud/agencesSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Formulaire (utilisé pour Ajouter & Modifier) ---
function AgenceForm({ initialData = {}, onSave, onCancel, loading }) {
  const [nom, setNom] = useState(initialData.nom || "");
  const [code, setCode] = useState(initialData.code || "");

  useEffect(() => {
    setNom(initialData.nom || "");
    setCode(initialData.code || "");
  }, [initialData?.id]);

  const submit = (e) => { e.preventDefault(); onSave({ nom, code }); };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="nom">Nom</Label>
        <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
      </div>
      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Valider"}</Button>
      </DialogFooter>
    </form>
  );
}

// --- Confirmation suppression (single/multiple) ---
function DeleteConfirm({ names = [], onConfirm, onCancel, loading }) {
  const label = names.length > 1 ? "les agences suivantes" : "l’agence suivante";
  return (
    <div className="space-y-4">
      <p>Voulez-vous vraiment supprimer {label} ?</p>
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

export default function AgencesTable() {
  const dispatch = useDispatch();
  const items = useSelector(selectAgences);
  const loading = useSelector(selectAgencesLoading);
  const error = useSelector(selectAgencesError);

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  // état du Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { dispatch(fetchAgences()); }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(r => r.nom?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q));
  }, [items, search]);

  const onSelect = useCallback((state) => setSelectedRows(state.selectedRows), []);

  // ---- actions qui ouvrent TOUJOURS un Dialog ----
  const onAdd = () => {
    setDialogTitle("Ajouter une Agence");
    setDialogContent(
      <AgenceForm
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(createAgence(form)).unwrap(); setDialogOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    );
    setDialogOpen(true);
  };

  const onEdit = (row) => {
    setDialogTitle("Modifier l’Agence");
    setDialogContent(
      <AgenceForm
        initialData={row}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(updateAgence({ id: row.id, data: form })).unwrap(); setDialogOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    );
    setDialogOpen(true);
  };

  const onDeleteOne = (row) => {
    setDialogTitle("Supprimer l’Agence");
    setDialogContent(
      <DeleteConfirm
        names={[row.nom]}
        onConfirm={async () => {
          setBusy(true);
          try { await dispatch(deleteAgence(row.id)).unwrap(); setDialogOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    );
    setDialogOpen(true);
  };

  const onDeleteMany = () => {
    const ids = selectedRows.map(r => r.id);
    const names = selectedRows.map(r => r.nom);
    setDialogTitle("Supprimer la sélection");
    setDialogContent(
      <DeleteConfirm
        names={names}
        onConfirm={async () => {
          setBusy(true);
          try {
            await dispatch(deleteManyAgences(ids)).unwrap();
            setClearSelToggle(v => !v); // clear sélection
            setDialogOpen(false);
          } finally { setBusy(false); }
        }}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    );
    setDialogOpen(true);
  };

  const columns = [
    { name: "Nom", selector: r => r.nom, sortable: true },
    { name: "Code", selector: r => r.code, sortable: true },
    {
      name: "Actions",
      cell: row => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(row)}>Modifier</Button>
          <Button size="sm" variant="destructive" onClick={() => onDeleteOne(row)}>Supprimer</Button>
        </div>
      ),
      button: true,
      ignoreRowClick: true,
      width: "220px",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Agences</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Recherche" className="w-56" onChange={(e) => setSearch(e.target.value)} />
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
              <div className="text-sm text-zinc-600">Supprimer la sélection ({selectedRows.length})</div>
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

      {/* Dialog shadcn pour toutes les opérations */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
          <div className="pt-2">{dialogContent}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
