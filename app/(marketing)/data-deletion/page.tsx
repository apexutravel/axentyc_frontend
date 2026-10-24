"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, ShieldCheck, XCircle } from "lucide-react";
import { API_URL } from "@/config/api";

type Status = { found: boolean; status?: string; requestedAt?: string } | null;

function DataDeletion() {
  const code = useSearchParams().get("code");
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    if (!code) return;
    fetch(`${API_URL}/webhook/facebook/data-deletion/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((j) => setStatus(j?.data ?? j))
      .catch(() => setStatus({ found: false }));
  }, [code]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold">Eliminación de datos</h1>
      <p className="mb-8 text-sm text-default-400">Cómo eliminar tus datos de AXENTYC.</p>

      {code && (
        <div className="mb-8 rounded-2xl border border-divider p-5">
          <p className="mb-1 text-xs uppercase tracking-wide text-default-400">Código de confirmación</p>
          <p className="mb-3 break-all font-mono text-sm">{code}</p>
          {!status ? (
            <p className="text-sm text-default-500">Consultando…</p>
          ) : status.found && status.status === "completed" ? (
            <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 size={16} /> Solicitud completada: revocamos las conexiones y eliminamos los tokens de acceso asociados a tu cuenta de Facebook.</p>
          ) : status.found ? (
            <p className="flex items-center gap-2 text-sm text-warning"><XCircle size={16} /> La solicitud se recibió pero necesita revisión manual. Escríbenos a privacy@apexucode.com con este código.</p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-danger"><XCircle size={16} /> No encontramos una solicitud con ese código.</p>
          )}
        </div>
      )}

      <div className="space-y-6 text-sm leading-relaxed text-default-600">
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground"><ShieldCheck size={18} /> Si conectaste Facebook o Instagram</h2>
          <p>
            Quita AXENTYC desde Facebook (Configuración → Seguridad e inicio de sesión → Apps y sitios web). Facebook nos notifica y, de forma automática,
            desconectamos tus páginas, cuentas de Instagram y webhooks, y borramos los tokens de acceso guardados.
          </p>
        </section>
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-foreground"><Mail size={18} /> Eliminar tu cuenta o tus datos</h2>
          <p>
            Escribe a <a className="text-primary underline" href="mailto:privacy@apexucode.com?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20datos">privacy@apexucode.com</a> con el asunto
            &quot;Solicitud de eliminación de datos&quot; desde el correo con el que te registraste. Procesamos la solicitud en un máximo de 30 días hábiles.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Si eres cliente de una empresa que usa AXENTYC</h2>
          <p>
            Tus mensajes y datos de contacto pertenecen a la empresa con la que hablaste. Solicita la eliminación directamente a esa empresa; ella puede borrarlos desde su cuenta.
          </p>
        </section>
      </div>
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <Suspense>
      <DataDeletion />
    </Suspense>
  );
}
