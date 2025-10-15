import api from "@/lib/axios";
import { setCredentials } from "./authSlice";

/**
 * Login avec application/x-www-form-urlencoded
 * Body: username, password
 * Réponse:
 * {
 *   "token": "...",
 *   "username": "admin",
 *   "email": "admin@feicom.com",
 *   "role": "NATIONAL" | "REGIONAL",
 *   "agence": null | "...",
 *   "agence_id": null | number
 * }
 */
export async function login(dispatch, { username, password }) {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const { data } = await api.post("/feicom/api/login/", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // Normalise l’objet user qu’on garde en store
  const user = {
    username: data.username,
    email: data.email,
    role: data.role,          // "NATIONAL" | "REGIONAL"
    agence: data.agence,
    agence_id: data.agence_id,
  };

  dispatch(setCredentials({ token: data.token, user }));
  return data;
}
