"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { addToast } from "@heroui/toast";
import { CheckCircle2, XCircle, Facebook, Users, ArrowLeft, ExternalLink, Instagram } from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";

interface FacebookPage {
  id: string;
  name: string;
  picture?: string;
  category?: string;
  fanCount?: number;
  instagramAccount?: {
    id: string;
    username: string;
    name: string;
    profilePicture?: string;
    followersCount?: number;
  };
}

export default function FacebookCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "pages" | "connecting" | "success" | "error">("loading");
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [error, setError] = useState("");
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);
  const [selectionToken, setSelectionToken] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setStatus("error");
      setError(searchParams.get("error_description") || "El usuario canceló la autorización");
      return;
    }

    if (!code) {
      setStatus("error");
      setError("No se recibió código de autorización de Facebook");
      return;
    }

    exchangeToken(code);
  }, [searchParams]);

  const exchangeToken = async (code: string) => {
    try {
      const redirectUri = `${window.location.origin}/integrations/facebook/callback`;
      console.log('[FB Callback] Exchanging code, redirectUri:', redirectUri);

      const res = await api.post<any>(API_ENDPOINTS.integrations.facebook.exchangeToken, {
        code,
        redirectUri,
      });

      const data = (res as any)?.data ?? res;
      console.log('[FB Callback] Exchange response:', JSON.stringify(data));

      if (data.pages && data.pages.length > 0 && data.selectionToken) {
        setSelectionToken(data.selectionToken);
        setPages(data.pages);
        setStatus("pages");
      } else {
        setStatus("error");
        setError(
          "Facebook no entregó páginas conectables para esta autorización.\n\n" +
          "Si viste tus páginas y seleccionaste una, normalmente significa que esa página no otorgó todos los accesos necesarios o tu usuario no tiene permisos suficientes sobre esa página.\n\n" +
          "Qué hacer:\n" +
          "• En Facebook, selecciona nuevamente la página y acepta todos los permisos\n" +
          "• Verifica que tu usuario tenga control completo/admin de esa página\n" +
          "• Si otra página sí conecta, revisa los accesos específicos de las páginas que fallan\n" +
          "• Si el problema continúa, contacta soporte para revisar la autorización de esa página"
        );
      }
    } catch (e: any) {
      const detail = e?.response?.data || e?.message || 'Error desconocido';
      console.error('[FB Callback] Exchange error:', detail);
      setStatus("error");
      setError(typeof detail === 'object' ? JSON.stringify(detail) : detail);
    }
  };

  const connectPage = async (page: FacebookPage) => {
    setConnectingPageId(page.id);
    setStatus("connecting");
    try {
      await api.post(API_ENDPOINTS.integrations.facebook.connectPage, {
        pageId: page.id,
        selectionToken,
      });

      setStatus("success");
      addToast({ title: `Página "${page.name}" conectada exitosamente`, color: "success" });
    } catch (e: any) {
      setStatus("error");
      setError(e?.response?.data?.message || "Error al conectar la página");
    } finally {
      setConnectingPageId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Facebook size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold">Conectar Facebook Messenger</h1>
          <p className="text-sm text-default-500">Selecciona la página que deseas conectar</p>
        </div>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <Card className="border border-divider">
          <CardBody className="flex items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-default-500">Verificando autorización con Facebook...</p>
          </CardBody>
        </Card>
      )}

      {/* Page Selection */}
      {status === "pages" && (
        <div className="space-y-3">
          <p className="text-sm text-default-500">
            Se encontraron <strong>{pages.length}</strong> página(s). Selecciona cuál conectar:
          </p>
          {pages.map((page) => (
            <Card key={page.id} className="border border-divider hover:border-primary/50 transition-colors">
              <CardBody className="flex-row items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  {page.picture ? (
                    <Avatar src={page.picture} size="md" radius="lg" />
                  ) : (
                    <Avatar name={page.name} size="md" radius="lg" color="primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{page.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {page.category && (
                        <Chip size="sm" variant="flat" className="text-[10px]">{page.category}</Chip>
                      )}
                      {page.fanCount != null && (
                        <span className="text-xs text-default-400 flex items-center gap-1">
                          <Users size={10} /> {page.fanCount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {page.instagramAccount && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-default-500">
                        <Instagram size={12} className="text-pink-500" />
                        <span className="font-medium">@{page.instagramAccount.username}</span>
                        {page.instagramAccount.followersCount != null && (
                          <span className="text-default-400">• {page.instagramAccount.followersCount.toLocaleString()} seguidores</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => connectPage(page)}
                  isLoading={connectingPageId === page.id}
                  isDisabled={connectingPageId !== null}
                >
                  Conectar
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Connecting */}
      {status === "connecting" && (
        <Card className="border border-divider">
          <CardBody className="flex items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-default-500">Conectando página y suscribiendo webhooks...</p>
          </CardBody>
        </Card>
      )}

      {/* Success */}
      {status === "success" && (
        <Card className="border border-success/30 bg-success/5">
          <CardBody className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-success" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-success">¡Conexión Exitosa!</h2>
              <p className="text-sm text-default-500 mt-1">
                Tu página de Facebook ha sido conectada. Los mensajes de Messenger{" "}
                {pages.find(p => p.id === connectingPageId)?.instagramAccount && "e Instagram DMs "}
                aparecerán automáticamente en tu Contact Center.
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="flat"
                startContent={<ArrowLeft size={14} />}
                onPress={() => router.push("/integrations")}
              >
                Volver a Integraciones
              </Button>
              <Button
                color="primary"
                onPress={() => router.push("/live-chat")}
              >
                Ir a Contact Center
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Error */}
      {status === "error" && (
        <Card className="border border-danger/30 bg-danger/5">
          <CardBody className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
              <XCircle size={32} className="text-danger" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-danger">Error de Conexión</h2>
              <p className="text-sm text-default-500 mt-1 max-w-md whitespace-pre-line text-left">{error}</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  startContent={<ArrowLeft size={14} />}
                  onPress={() => router.push("/integrations")}
                >
                  Volver a Integraciones
                </Button>
                <Button
                  color="primary"
                  onPress={() => router.push("/integrations/facebook")}
                >
                  Reintentar Conexión
                </Button>
              </div>
              <Button
                size="sm"
                variant="light"
                startContent={<ExternalLink size={14} />}
                onPress={() => window.open("https://developers.facebook.com/apps", "_blank")}
              >
                Abrir Facebook Developers
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
