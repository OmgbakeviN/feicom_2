import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  // Si tu as réellement un CardAction dans ton projet, laisse-le.
  // Sinon, commente la ligne suivante et remplace <CardAction> par un <div>.
  // CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { login } from "@/features/auth/authService";

export function LoginForm() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(dispatch, { username, password }); // appelle /feicom/api/login/
      navigate(from, { replace: true }); // NATIONAL & REGIONAL → même dashboard
    } catch (e) {
      const msg =
        e?.detail ||
        e?.message ||
        (typeof e === "string" ? e : "Échec de connexion");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder au tableau de bord
        </CardDescription>

        {/* Si tu n'as pas CardAction, remplace par un <div className="mt-2">…</div> ou retire ce bloc */}
        {/* <CardAction>
          <Button variant="link">S’inscrire</Button>
        </CardAction> */}
      </CardHeader>

      <CardContent>
        <form id="login-form" onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="username">Nom d’utilisateur</Label>
            <Input
              id="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setU(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Mot de passe</Label>
              {/* Lien token reset si tu en as un */}
              {/* <a href="#" className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                Mot de passe oublié ?
              </a> */}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setP(e.target.value)}
              required
            />
          </div>

          {err ? <div className="text-sm text-red-600">{String(err)}</div> : null}
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        {/* Le bouton submit cible le form ci-dessus via l’attribut form */}
        <Button type="submit" form="login-form" className="w-full bg-blue-500" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>

        {/* Optionnel: à retirer si inutile */}
        {/* <Button variant="outline" className="w-full" disabled>
          Login with Google
        </Button> */}
      </CardFooter>
    </Card>
  );
}
