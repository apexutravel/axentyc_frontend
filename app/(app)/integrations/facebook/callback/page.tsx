"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { addToast } from "@heroui/toast";
import { CheckCircle2, XCircle, Facebook, Users, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";

interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  picture?: string;
  category?: string;
  fanCount?: number;
}

export default function FacebookCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "pages" | "connecting" | "success" | "error">("loading");
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [error, setError] = useState("");
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);
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
      const res = await api.post<any>(API_ENDPOINTS.integrations.facebook.exchangeToken, {
        code,
        redirectUri,
      });

      const data = (res as any)?.data ?? res;

      if (data.pages && data.pages.length > 0) {
        setPages(data.pages);
        setStatus("pages");
      } else {
        setStatus("error");
        setError("No se encontraron páginas de Facebook. Asegúrate de tener al menos una página administrada.");
      }
    } catch (e: any) {
      setStatus("error");
      setError(e?.response?.data?.message || e?.message || "Error al intercambiar token con Facebook");
    }
  };

  const connectPage = async (page: FacebookPage) => {
    setConnectingPageId(page.id);
    setStatus("connecting");
    try {
      await api.post(API_ENDPOINTS.integrations.facebook.connectPage, {
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.accessToken,
        picture: page.picture,
        category: page.category,
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
                  <div>
                    <p className="text-sm font-semibold">{page.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {page.category && (
                        <Chip size="sm" variant="flat" className="text-[10px]">{page.category}</Chip>
                      )}
                      {page.fanCount != null && (
                        <span className="text-xs text-default-400 flex items-center gap-1">
                          <Users size={10} /> {page.fanCount.toLocaleString()} seguidores
                        </span>
                      )}
                    </div>
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
                Tu página de Facebook Messenger ha sido conectada. Los mensajes entrantes aparecerán
                automáticamente en tu bandeja de conversaciones.
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
                onPress={() => router.push("/conversations")}
              >
                Ir a Conversaciones
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
              <p className="text-sm text-default-500 mt-1 max-w-md">{error}</p>
            </div>
            <Button
              variant="flat"
              startContent={<ArrowLeft size={14} />}
              onPress={() => router.push("/integrations")}
            >
              Volver a Integraciones
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
