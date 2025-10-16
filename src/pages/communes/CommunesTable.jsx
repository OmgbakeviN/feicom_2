import { useEffect, useMemo, useState, useCallback } from "react";
import DataTable from "react-data-table-component";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCommunes, createCommune, updateCommune, deleteCommune, deleteManyCommunes,
  selectCommunes, selectCommunesLoading, selectCommunesError
} from "@/features/crud/communesSlice";
import {
  fetchDepartements, selectDepartements, selectDepartementsLoading
} from "@/features/crud/departementsSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- Formulaire Commune (Ajout/Edition) ---
function CommuneForm({ initialData = {}, departements = [], loadingDeps, onSave, onCancel, loading }) {
  // initialData attendu: { id?, nom, departement: { id, nom } }
  const [nom, setNom] = useState(initialData.nom || "");
  const [departementId, setDepartementId] = useState(
    initialData?.departement?.id || ""
  );

  useEffect(() => {
    setNom(initialData.nom || "");
    setDepartementId(initialData?.departement?.id || "");
  }, [initialData?.id]);

  const submit = (e) => {
    e.preventDefault();
    // API attend { nom, departement: <id> }
    onSave({ nom, departement: Number(departementId) });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="nom">Nom de la Commune</Label>
        <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="departement">Département</Label>
        {/* Native <select> (simple et efficace) */}
        <select
          id="departement"
          className="w-full rounded-md border px-3 py-2"
          value={departementId}
          onChange={(e) => setDepartementId(e.target.value)}
          required
        >
          <option value="" disabled>{loadingDeps ? "Chargement..." : "Sélectionner un département"}</option>
          {departements.map((d) => (
            <option key={d.id} value={d.id}>{d.nom}</option>
          ))}
        </select>
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Valider"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// --- Confirmation suppression ---
function DeleteConfirm({ names = [], onConfirm, onCancel, loading }) {
  const label = names.length > 1 ? "les communes suivantes" : "la commune suivante";
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

export default function CommunesTable() {
  const dispatch = useDispatch();

  // Communes
  const items = useSelector(selectCommunes);
  const loading = useSelector(selectCommunesLoading);
  const error = useSelector(selectCommunesError);

  // Départements (pour le select)
  const departements = useSelector(selectDepartements);
  const depsLoading = useSelector(selectDepartementsLoading);

  // UI states
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [clearSelToggle, setClearSelToggle] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchCommunes());
    dispatch(fetchDepartements());
  }, [dispatch]);

  // Filtrage sur nom de commune et/ou nom de département
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(r =>
      r.nom?.toLowerCase().includes(q) ||
      r.departement?.nom?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const onSelect = useCallback((state) => setSelectedRows(state.selectedRows), []);

  // --- Actions (ouvrent TOUJOURS un Dialog) ---
  const onAdd = () => {
    setDialogTitle("Ajouter une Commune");
    setDialogContent(
      <CommuneForm
        departements={departements}
        loadingDeps={depsLoading}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(createCommune(form)).unwrap(); setDialogOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    );
    setDialogOpen(true);
  };

  const onEdit = (row) => {
    setDialogTitle("Modifier la Commune");
    setDialogContent(
      <CommuneForm
        initialData={row}
        departements={departements}
        loadingDeps={depsLoading}
        onSave={async (form) => {
          setBusy(true);
          try { await dispatch(updateCommune({ id: row.id, data: form })).unwrap(); setDialogOpen(false); }
          finally { setBusy(false); }
        }}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    );
    setDialogOpen(true);
  };

  const onDeleteOne = (row) => {
    setDialogTitle("Supprimer la Commune");
    setDialogContent(
      <DeleteConfirm
        names={[`${row.nom} (${row.departement?.nom || "-"})`]}
        onConfirm={async () => {
          setBusy(true);
          try { await dispatch(deleteCommune(row.id)).unwrap(); setDialogOpen(false); }
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
    const names = selectedRows.map(r => `${r.nom} (${r.departement?.nom || "-"})`);
    setDialogTitle("Supprimer la sélection");
    setDialogContent(
      <DeleteConfirm
        names={names}
        onConfirm={async () => {
          setBusy(true);
          try {
            await dispatch(deleteManyCommunes(ids)).unwrap();
            setClearSelToggle(v => !v);
            setDialogOpen(false);
          } finally { setBusy(false); }
        }}
        onCancel={() => setDialogOpen(false)}
        loading={busy}
      />
    );
    setDialogOpen(true);
  };

  // Colonnes demandées: communes.nom, communes.departement.nom
  const columns = [
    { name: "Commune", selector: r => r.nom, sortable: true },
    { name: "Département", selector: r => r.departement?.nom, sortable: true },
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
      width: "240px",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Communes</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Recherche (commune / département)"
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

      {/* Dialog shadcn pour TOUTES les actions */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle></DialogHeader>
          <div className="pt-2">{dialogContent}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
