import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones — AXENTYC",
  description: "Términos y condiciones de uso de la plataforma AXENTYC.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Términos y Condiciones del Servicio</h1>
      <p className="text-sm text-default-400 mb-10">
        Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-default-600">
        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar <strong>AXENTYC</strong> (el &quot;Servicio&quot;), aceptas estar vinculado por estos
            Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar el Servicio.
          </p>
          <p>
            Estos términos se aplican a todos los usuarios de la plataforma, incluyendo administradores, agentes y
            cualquier persona que acceda al Servicio.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Descripción del Servicio</h2>
          <p>
            AXENTYC es una plataforma de gestión de comunicaciones y CRM que permite a las empresas:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Centralizar conversaciones desde múltiples canales (Facebook Messenger, Instagram, correo electrónico, chat en vivo).</li>
            <li>Gestionar contactos, leads y relaciones con clientes.</li>
            <li>Configurar integraciones con plataformas de terceros.</li>
            <li>Colaborar en equipo para atender consultas de clientes.</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Registro y Cuenta</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Debes proporcionar información veraz y actualizada al registrarte.</li>
            <li>Eres responsable de mantener la confidencialidad de tu contraseña y credenciales de acceso.</li>
            <li>Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.</li>
            <li>Una cuenta representa a una empresa (tenant). El administrador puede invitar a otros usuarios.</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Uso Aceptable</h2>
          <p>Al utilizar el Servicio, te comprometes a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No utilizar el Servicio para enviar spam, contenido ilegal o mensajes no solicitados.</li>
            <li>Respetar las políticas de las plataformas integradas (Meta, Google, etc.).</li>
            <li>No intentar acceder a datos de otros tenants o cuentas sin autorización.</li>
            <li>No realizar ingeniería inversa, descompilar o intentar extraer el código fuente del Servicio.</li>
            <li>No utilizar el Servicio para actividades fraudulentas o que violen las leyes aplicables.</li>
            <li>Cumplir con todas las leyes de protección de datos aplicables al comunicarte con tus clientes.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Integraciones con Terceros</h2>
          <p>
            El Servicio permite conectar canales de comunicación de terceros como Facebook Messenger, Instagram y
            proveedores de correo electrónico. Al configurar estas integraciones:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Autorizas a AXENTYC a acceder a las APIs de dichas plataformas en tu nombre.</li>
            <li>Eres responsable de cumplir con los términos de servicio de cada plataforma integrada.</li>
            <li>Las credenciales que proporcionas (App ID, App Secret, tokens) se almacenan de forma segura y se utilizan exclusivamente para operar las integraciones.</li>
            <li>AXENTYC no es responsable de cambios en las APIs o políticas de terceros que afecten la funcionalidad de las integraciones.</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Privacidad y Datos</h2>
          <p>
            El tratamiento de datos personales se rige por nuestra{" "}
            <a href="/privacy" className="text-primary underline">Política de Privacidad</a>.
            Al utilizar el Servicio, aceptas las prácticas descritas en dicha política.
          </p>
          <p>
            Cada tenant es responsable del tratamiento de los datos de sus propios clientes y contactos,
            y debe cumplir con las leyes de protección de datos aplicables en su jurisdicción.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Propiedad Intelectual</h2>
          <p>
            Todo el contenido, código, diseño, marcas y materiales del Servicio son propiedad de AXENTYC
            o sus licenciantes. No se otorga ningún derecho de propiedad intelectual sobre el Servicio más
            allá de la licencia limitada de uso.
          </p>
          <p>
            El contenido que subas o transmitas a través del Servicio sigue siendo de tu propiedad. Nos
            otorgas una licencia limitada para procesarlo con el fin de proporcionarte el Servicio.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Planes y Pagos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>AXENTYC puede ofrecer planes gratuitos y de pago con diferentes niveles de funcionalidad.</li>
            <li>Los precios y características de cada plan están disponibles en nuestra página de precios.</li>
            <li>Nos reservamos el derecho de modificar los precios con un aviso previo razonable.</li>
            <li>Los pagos no son reembolsables salvo que se indique lo contrario.</li>
          </ul>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Limitación de Responsabilidad</h2>
          <p>
            El Servicio se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;, sin garantías de ningún tipo,
            expresas o implícitas. En la máxima medida permitida por la ley:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>No garantizamos que el Servicio sea ininterrumpido, libre de errores o completamente seguro.</li>
            <li>No somos responsables de daños indirectos, incidentales, especiales o consecuentes.</li>
            <li>Nuestra responsabilidad total no excederá el monto pagado por el usuario en los últimos 12 meses.</li>
          </ul>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Suspensión y Terminación</h2>
          <p>
            Nos reservamos el derecho de suspender o terminar tu acceso al Servicio en caso de:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violación de estos Términos y Condiciones.</li>
            <li>Uso fraudulento o abusivo del Servicio.</li>
            <li>Solicitud por parte de autoridades legales.</li>
            <li>Falta de pago en planes de pago.</li>
          </ul>
          <p>
            Puedes cancelar tu cuenta en cualquier momento desde la configuración de tu perfil o
            contactándonos a <a href="mailto:soporte@apexucode.com" className="text-primary underline">soporte@apexucode.com</a>.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Modificaciones</h2>
          <p>
            Podemos modificar estos Términos en cualquier momento. Publicaremos los cambios en esta página y
            actualizaremos la fecha de &quot;última actualización&quot;. El uso continuado del Servicio después de
            cualquier modificación constituye la aceptación de los nuevos términos.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">12. Ley Aplicable</h2>
          <p>
            Estos Términos se regirán e interpretarán de acuerdo con las leyes aplicables en la jurisdicción
            donde opera AXENTYC, sin dar efecto a ningún principio de conflicto de leyes.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">13. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos Términos y Condiciones, contáctanos en:
          </p>
          <ul className="list-none pl-0 space-y-1">
            <li><strong>Email:</strong> <a href="mailto:soporte@apexucode.com" className="text-primary underline">soporte@apexucode.com</a></li>
            <li><strong>Plataforma:</strong> <a href="https://www.apexucode.com" className="text-primary underline">apexucode.com</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
