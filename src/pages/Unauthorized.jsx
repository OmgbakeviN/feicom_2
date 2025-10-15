export default function Unauthorized() {
  return (
    <div className="mx-auto mt-24 max-w-lg rounded-2xl border bg-white p-8 text-center shadow">
      <h1 className="mb-2 text-xl font-semibold">401 – Unauthorized</h1>
      <p className="text-sm text-gray-600">Vous n’avez pas accès à cette section.</p>
    </div>
  );
}
