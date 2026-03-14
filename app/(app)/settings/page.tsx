"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import { Textarea } from "@heroui/input";
import { motion } from "framer-motion";
import { Save, Copy, Check, Code2, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/api";
import { addToast } from "@heroui/toast";

export default function SettingsPage() {
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [widgetScript, setWidgetScript] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWidgetConfig();
  }, []);

  const loadWidgetConfig = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.chatWidget.get);
      const config = response.data?.data || response.data;
      if (config) {
        setWidgetScript(config.script || "");
      }
    } catch (error) {
      console.error("Error loading widget config:", error);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(widgetScript);
    setCopied(true);
    addToast({ title: "Código copiado al portapapeles", color: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleWidget = async (enabled: boolean) => {
    setWidgetEnabled(enabled);
    setLoading(true);
    try {
      // Aquí actualizarías el tenant settings
      await api.patch(API_ENDPOINTS.tenants.update("current"), {
        settings: {
          widgetEnabledOnLanding: enabled,
        },
      });
      addToast({
        title: enabled
          ? "Widget activado en el landing"
          : "Widget desactivado en el landing",
        color: "success",
      });
    } catch (error) {
      addToast({ title: "Error al actualizar configuración", color: "danger" });
      setWidgetEnabled(!enabled);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
    >
      <div>
        <h1 className="text-2xl font-bold">Configuraci&oacute;n</h1>
        <p className="text-default-500 text-sm mt-1">
          Administra la configuraci&oacute;n de tu cuenta y tu empresa.
        </p>
      </div>

      <Tabs variant="underlined">
        <Tab key="general" title="General">
          <div className="space-y-6 mt-4">
            <Card className="border border-divider">
              <CardHeader>
                <h3 className="text-lg font-semibold">Informaci&oacute;n de la Empresa</h3>
              </CardHeader>
              <CardBody className="gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    defaultValue="Mi Empresa"
                    label="Nombre de la empresa"
                    variant="bordered"
                  />
                  <Input
                    defaultValue="mi-empresa"
                    label="Slug"
                    variant="bordered"
                  />
                  <Input
                    defaultValue="admin@miempresa.com"
                    label="Email de contacto"
                    type="email"
                    variant="bordered"
                  />
                  <Input
                    defaultValue="+52 555 1234567"
                    label="Tel&eacute;fono"
                    variant="bordered"
                  />
                </div>
                <Button
                  className="w-fit"
                  color="primary"
                  startContent={<Save size={16} />}
                >
                  Guardar Cambios
                </Button>
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardHeader>
                <h3 className="text-lg font-semibold">Preferencias</h3>
              </CardHeader>
              <CardBody className="gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    defaultSelectedKeys={["es"]}
                    label="Idioma"
                    variant="bordered"
                  >
                    <SelectItem key="es">Espa&ntilde;ol</SelectItem>
                    <SelectItem key="en">English</SelectItem>
                    <SelectItem key="pt">Portugu&ecirc;s</SelectItem>
                  </Select>
                  <Select
                    defaultSelectedKeys={["America/Mexico_City"]}
                    label="Zona Horaria"
                    variant="bordered"
                  >
                    <SelectItem key="America/Mexico_City">America/Mexico City (GMT-6)</SelectItem>
                    <SelectItem key="America/New_York">America/New York (GMT-5)</SelectItem>
                    <SelectItem key="America/Los_Angeles">America/Los Angeles (GMT-8)</SelectItem>
                    <SelectItem key="Europe/Madrid">Europe/Madrid (GMT+1)</SelectItem>
                  </Select>
                  <Select
                    defaultSelectedKeys={["USD"]}
                    label="Moneda"
                    variant="bordered"
                  >
                    <SelectItem key="USD">USD - D&oacute;lar Americano</SelectItem>
                    <SelectItem key="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem key="EUR">EUR - Euro</SelectItem>
                  </Select>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="notifications" title="Notificaciones">
          <div className="space-y-6 mt-4">
            <Card className="border border-divider">
              <CardHeader>
                <h3 className="text-lg font-semibold">Notificaciones</h3>
              </CardHeader>
              <CardBody className="gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Nuevo mensaje</p>
                    <p className="text-xs text-default-400">
                      Notificar cuando se recibe un nuevo mensaje
                    </p>
                  </div>
                  <Switch defaultSelected size="sm" />
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Nuevo lead</p>
                    <p className="text-xs text-default-400">
                      Notificar cuando se crea un nuevo lead
                    </p>
                  </div>
                  <Switch defaultSelected size="sm" />
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Deal cerrado</p>
                    <p className="text-xs text-default-400">
                      Notificar cuando un deal se cierra
                    </p>
                  </div>
                  <Switch defaultSelected size="sm" />
                </div>
                <Divider />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notificaciones por email</p>
                    <p className="text-xs text-default-400">
                      Recibir resumen diario por email
                    </p>
                  </div>
                  <Switch size="sm" />
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="team" title="Equipo">
          <div className="space-y-6 mt-4">
            <Card className="border border-divider">
              <CardHeader className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Miembros del Equipo</h3>
                <Button color="primary" size="sm">
                  Invitar Miembro
                </Button>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-default-500">
                  Gestiona los miembros de tu equipo y sus roles (Admin, Manager, Agent).
                </p>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="billing" title="Facturación">
          <div className="space-y-6 mt-4">
            <Card className="border border-divider">
              <CardHeader>
                <h3 className="text-lg font-semibold">Plan Actual</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-default-500">
                  Gestiona tu plan de suscripci&oacute;n y m&eacute;todos de pago.
                </p>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="widget" title="Widget">
          <div className="space-y-6 mt-4">
            <Card className="border border-divider">
              <CardHeader className="flex items-center gap-2">
                <Globe className="text-primary" size={20} />
                <h3 className="text-lg font-semibold">Widget en Landing</h3>
              </CardHeader>
              <CardBody className="gap-4">
                <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Activar widget en el landing público</p>
                    <p className="text-xs text-default-400 mt-1">
                      El widget de chat aparecerá automáticamente en tu página de inicio
                    </p>
                  </div>
                  <Switch
                    isSelected={widgetEnabled}
                    onValueChange={handleToggleWidget}
                    isDisabled={loading}
                    size="lg"
                  />
                </div>
                
                {widgetEnabled && (
                  <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                    <p className="text-sm text-success-700 flex items-center gap-2">
                      <Check size={16} />
                      Widget activo en tu landing
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="border border-divider">
              <CardHeader className="flex items-center gap-2">
                <Code2 className="text-primary" size={20} />
                <h3 className="text-lg font-semibold">Código de Instalación</h3>
              </CardHeader>
              <CardBody className="gap-4">
                <p className="text-sm text-default-500">
                  Copia este código para instalar el widget en cualquier sitio web externo.
                </p>
                
                {widgetScript ? (
                  <>
                    <Textarea
                      value={widgetScript}
                      readOnly
                      minRows={8}
                      variant="bordered"
                      classNames={{
                        input: "font-mono text-xs",
                      }}
                    />
                    <Button
                      color="primary"
                      startContent={copied ? <Check size={16} /> : <Copy size={16} />}
                      onClick={handleCopyScript}
                      className="w-fit"
                    >
                      {copied ? "¡Copiado!" : "Copiar Código"}
                    </Button>
                  </>
                ) : (
                  <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-sm text-warning-700">
                      No hay configuración de widget. Ve a la sección de Chat Widget para configurarlo.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </motion.div>
  );
}
