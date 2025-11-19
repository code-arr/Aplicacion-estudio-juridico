// src/pages/OAuthDone.tsx  (React, muy simple)
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function OAuthDone() {
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const returnTo = params.get("returnTo") || "/#/dashboard/settings";
    const status = params.get("status") || "success";

    // Ajustá el scheme por el que tu app registre (ej: legalapp)
    const scheme = "ibarrayasoc";
    const deepUrl = `${scheme}://oauth-callback?status=${encodeURIComponent(
      status
    )}&returnTo=${encodeURIComponent(returnTo)}`;

    // Mostrar deepUrl para copiar y también abrirlo
    // Intentamos abrir con location; en algunos SOs se necesita iframe fallback
    const start = Date.now();
    try {
      window.location.href = deepUrl;
    } catch (e) {
      // ignore
    }

    // fallback: si no se abrió en 1s, mostrar botón manual (la UI la podés implementar)
    setTimeout(() => {
      if (Date.now() - start > 900) {
        // muestra fallback (ej: un modal o un botón visible).
        // Aquí lo dejamos simple: crear un link en DOM
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="padding:20px;max-width:600px;margin:30px auto;text-align:center">
            <p>No se abrió la app automáticamente.</p>
            <a href="${deepUrl}" style="display:inline-block;padding:10px 14px;border:1px solid #ccc;border-radius:6px;text-decoration:none">Abrir la app</a>
            <p style="font-size:0.9em;color:#666;margin-top:10px">Si eso falla, copiá este enlace:</p>
            <pre style="background:#f6f6f6;padding:8px;border-radius:6px">${deepUrl}</pre>
          </div>`;
        document.body.appendChild(el);
      }
    }, 900);
  }, [search]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h2>Volviendo a la aplicación…</h2>
      <p>
        Si tienes la aplicación instalada debería abrirse en unos segundos. Si
        no, verás un botón para abrirla manualmente.
      </p>
    </div>
  );
}
