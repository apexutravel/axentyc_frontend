# AXENTYC Frontend

Aplicación web de AXENTYC: Contact Center, CRM, catálogo, cotizaciones, facturas, pagos, automatizaciones y reportes.

Next.js 15 · React 18 · HeroUI · Tailwind CSS · Socket.IO.

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación abre en `http://localhost:3000`. Configura la URL del API en `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
```

El backend debe estar iniciado y su `CORS_ORIGIN` debe incluir esta URL.

## Rutas principales

- `/contact-center`: mensajes directos y comentarios de Facebook/Instagram.
- `/contacts`, `/leads`, `/deals`: CRM y pipeline.
- `/quotes`, `/invoices`, `/payments`: flujo comercial y cobros.
- `/automations`: reglas deterministas; la IA todavía está marcada como próxima.
- `/analytics`: reportes de conversaciones, ventas y embudo.
- `/integrations`: Meta, correo y widget web.

Las rutas antiguas `/live-chat`, `/comments` y `/comments-fb` redirigen al Contact Center.

## Verificación

```bash
npx tsc --noEmit
npm run build
```

La prueba funcional completa está en el backend: `npm run test:smoke`. Las comprobaciones que requieren servicios reales están en `../docs/MANUAL_TEST_CHECKLIST.md`.
