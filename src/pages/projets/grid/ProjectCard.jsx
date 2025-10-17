import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// PercentBar Tailwind (même logique que plus tôt)
const toPct = (v) => {
  const n = parseFloat(v ?? 0);
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
};
function PercentBar({ value }) {
  const pct = toPct(value);
  return (
    <div className="w-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div className="relative h-full rounded-full bg-zinc-900 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-zinc-600">{pct}%</div>
    </div>
  );
}

const fmtMoney = (n) => Number(n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "XAF" });
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("fr-FR") : "");

export default function ProjectCard({ p, onClick }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-2">{p.libelle}</CardTitle>
        <CardDescription className="text-xs">
          {p?.commune?.departement?.agence?.nom || "—"} · {p?.commune?.nom || "—"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Entreprise</span><span className="font-medium">{p?.entreprise?.nom || "—"}</span></div>
        <div className="flex justify-between"><span>Montant HT</span><span className="font-medium">{fmtMoney(p.montant_ht)}</span></div>
        <div className="flex justify-between"><span>Début</span><span className="font-medium">{fmtDate(p.date_debut)}</span></div>
        <div className="flex justify-between"><span>Fin</span><span className="font-medium">{fmtDate(p.date_fin)}</span></div>
        <div>
          <div className="mb-1 text-xs text-zinc-600">Financement</div>
          <PercentBar value={p.payment_percent} />
        </div>
        <div>
          <div className="mb-1 text-xs text-zinc-600">Avancement</div>
          <PercentBar value={p.progress} />
        </div>
      </CardContent>
    </Card>
  );
}
