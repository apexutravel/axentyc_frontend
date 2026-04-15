import NextLink from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-between p-12">
        <NextLink className="flex items-center gap-2" href="/">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-xl">AXENTYC</span>
        </NextLink>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Centraliza tus ventas.
            <br />
            <span className="text-primary">Escala tu negocio.</span>
          </h2>
          <p className="mt-4 text-default-500">
            CRM Social Omnichannel que unifica WhatsApp, Instagram, Facebook y
            TikTok en una sola plataforma.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Inbox omnichannel unificado",
              "CRM con pipeline de ventas",
              "Automatizaciones inteligentes",
              "Analytics en tiempo real",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-primary"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-default-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-default-400">
          &copy; {new Date().getFullYear()} AXENTYC. Todos los derechos reservados.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <NextLink className="flex items-center gap-2" href="/">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl">AXENTYC</span>
            </NextLink>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
