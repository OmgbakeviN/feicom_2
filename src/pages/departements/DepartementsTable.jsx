import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchDepartements, createDepartement, updateDepartement,
  deleteDepartement, deleteManyDepartements,
  selectDepartements, selectDepartementsLoading, selectDepartementsError
} from "@/features/crud/departementsSlice";

import { fetchAgences, selectAgences } from "@/features/crud/agencesSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Formulaire Département (Ajout/Edition) ---
function DepartementForm({ initialData = {}, agences = [], onSave, onCancel, loading }) {
  const [nom, setNom] = useState(initialData.nom || "");
  const [agenceId, setAgenceId] = useState(initialData?.agence?.id || "");

  useEffect(() => {
    setNom(initialData.nom || "");
    setAgenceId(initialData?.agence?.id || "");
  }, [initialData?.id]);

  const submit = (e) => {
    e.preventDefault();
    onSave({ nom, agence: Number(agenceId) }); // API attend {nom, agence:<id>}
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="nom">Nom du Département</Label>
        <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="agence">Agence</Label>
        <select
          id="agence"
          className="w-full rounded-md border px-3 py-2"
          value={agenceId}
          onChange={(e) => setAgenceId(e.target.value)}
          required
        >
          <option value="" disabled>Sélectionner une agence</option>
          {agences.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom} ({a.code})
            </option>
          ))}
        </select>
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
  const label = names.length > 1 ? "les départements suivants" : "le département suivant";
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

export default function DepartementsTable() {
  const dispatch = useDispatch();

  // données
  const items = useSelector(selectDepartements);
  const loading = useSelector(selectDepartementsLoading);
  const error = useSelector(selectDepartementsError);
  const agences = useSelector(selectAgences); // pour le select

  // UI
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [node, setNode] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartements());
    dispatch(fetchAgences()); // pour alimenter le <select> des agences
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      r.nom?.toLowerCase().includes(q) ||
      r.agence?.nom?.toLowerCase().includes(q) ||
      r.agence?.code?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const onSelect = useCallback((state) => setSelectedRows(state.selectedRows), []);

  // --- Actions (toutes ouvrent un Dialog) ---
  const onAdd = () => {
    setTitle("Ajouter un Département");
    setNode(
      <DepartementForm
        agences={agences}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(createDepartement(form)).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onEdit = (row) => {
    setTitle("Modifier le Département");
    setNode(
      <DepartementForm
        initialData={row}
        agences={agences}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(updateDepartement({ id: row.id, data: form })).unwrap(); setOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setOpen(false)}
        loading={busy}
      />
    );
    setOpen(true);
  };

  const onDeleteOne = (row) => {
    setTitle("Supprimer le Département");
    setNode(
      <DeleteConfirm
        names={[`${row.nom} (${row.agence?.nom || "-"})`]}
        onConfirm={async () => {
          setBusy(true);
          try { await dispatch(deleteDepartement(row.id)).unwrap(); setOpen(false); }
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
    const names = selectedRows.map((r) => `${r.nom} (${r.agence?.nom || "-"})`);
    setTitle("Supprimer la sélection");
    setNode(
      <DeleteConfirm
        names={names}
        onConfirm={async () => {
          setBusy(true);
          try {
            await dispatch(deleteManyDepartements(ids)).unwrap();
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

  // Colonnes demandées
  const columns = [
    { name: "Département", selector: (r) => r.nom, sortable: true },
    { name: "Agence", selector: (r) => r.agence?.nom, sortable: true },
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
          <CardTitle>Gestion des Départements</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Recherche (département / agence)"
              className="w-72"
              onChange={(e) => setSearch(e.target.value)}
            />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="pt-2">{node}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
