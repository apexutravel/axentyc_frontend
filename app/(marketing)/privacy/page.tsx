import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — AXENTYC",
  description: "Política de privacidad de la plataforma AXENTYC.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm text-default-400 mb-10">
        Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-default-600">
        {/* 1 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Introducción</h2>
          <p>
            En <strong>AXENTYC</strong> (&quot;nosotros&quot;, &quot;nuestro&quot;), nos tomamos muy en serio la privacidad de nuestros usuarios.
            Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos la información personal
            cuando utilizas nuestra plataforma de gestión de comunicaciones y CRM (el &quot;Servicio&quot;).
          </p>
          <p>
            Al acceder o utilizar AXENTYC, aceptas las prácticas descritas en esta política.
            Si no estás de acuerdo, te pedimos que no utilices el Servicio.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Información que Recopilamos</h2>

          <h3 className="text-sm font-semibold text-foreground mt-4">2.1 Información proporcionada por el usuario</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Nombre, apellido y correo electrónico al registrarte.</li>
            <li>Nombre de tu empresa y datos de contacto comercial.</li>
            <li>Credenciales de integración con terceros (Facebook App ID, App Secret, tokens de acceso) que proporcionas voluntariamente para conectar tus canales.</li>
          </ul>

          <h3 className="text-sm font-semibold text-foreground mt-4">2.2 Información recopilada automáticamente</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dirección IP, tipo de navegador, sistema operativo y dispositivo.</li>
            <li>Páginas visitadas, tiempo de permanencia y acciones dentro de la plataforma.</li>
            <li>Cookies y tecnologías similares para mantener tu sesión activa.</li>
          </ul>

          <h3 className="text-sm font-semibold text-foreground mt-4">2.3 Información de terceros</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mensajes recibidos y enviados a través de Facebook Messenger, Instagram u otros canales conectados.</li>
            <li>Información de perfil público de contactos que interactúan con tus páginas de Facebook.</li>
            <li>Datos proporcionados mediante integraciones de correo electrónico (SMTP/IMAP).</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Uso de la Información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Proveer, operar y mejorar el Servicio.</li>
            <li>Gestionar tu cuenta y autenticación.</li>
            <li>Facilitar la comunicación entre tú y tus clientes a través de los canales integrados.</li>
            <li>Enviar notificaciones relacionadas con el Servicio (alertas, actualizaciones, soporte).</li>
            <li>Analizar el uso de la plataforma para mejorar la experiencia del usuario.</li>
            <li>Cumplir con obligaciones legales y regulatorias.</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Compartir Información</h2>
          <p>
            <strong>No vendemos ni alquilamos</strong> tu información personal a terceros.
            Solo compartimos datos en las siguientes circunstancias:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Proveedores de servicio:</strong> Utilizamos servicios de terceros (hosting, bases de datos, análisis) que procesan datos en nuestro nombre bajo acuerdos de confidencialidad.</li>
            <li><strong>Integraciones autorizadas:</strong> Cuando conectas canales como Facebook Messenger, los datos se intercambian con las APIs de Meta según sus propias políticas de privacidad.</li>
            <li><strong>Obligaciones legales:</strong> Podemos divulgar información si es requerido por ley, orden judicial o proceso legal.</li>
          </ul>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Almacenamiento y Seguridad</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Los datos se almacenan en servidores seguros con cifrado en tránsito (HTTPS/TLS).</li>
            <li>Las credenciales sensibles (App Secret, tokens) se almacenan de forma cifrada en nuestra base de datos.</li>
            <li>Implementamos controles de acceso basados en roles para proteger los datos de cada tenant.</li>
            <li>Realizamos copias de seguridad periódicas para prevenir pérdida de datos.</li>
          </ul>
          <p>
            Aunque tomamos medidas razonables para proteger tu información, ningún método de transmisión o almacenamiento
            es 100% seguro. No podemos garantizar seguridad absoluta.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Retención de Datos</h2>
          <p>
            Conservamos tu información mientras tu cuenta esté activa o sea necesario para proporcionarte el Servicio.
            Si decides eliminar tu cuenta, borraremos tu información personal en un plazo razonable, salvo que estemos
            obligados a conservarla por razones legales.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Tus Derechos</h2>
          <p>Dependiendo de tu jurisdicción, puedes tener derecho a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Acceder a la información personal que tenemos sobre ti.</li>
            <li>Rectificar datos inexactos o incompletos.</li>
            <li>Solicitar la eliminación de tus datos personales.</li>
            <li>Oponerte al procesamiento de tus datos.</li>
            <li>Solicitar la portabilidad de tus datos.</li>
          </ul>
          <p>
            Para ejercer estos derechos, contáctanos a través de <a href="mailto:privacy@apexucode.com" className="text-primary underline">privacy@apexucode.com</a>.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Eliminación de Datos de Usuario</h2>
          <p>
            Puedes solicitar la eliminación de todos tus datos en cualquier momento enviando un correo a{" "}
            <a href="mailto:privacy@apexucode.com" className="text-primary underline">privacy@apexucode.com</a> con el asunto
            &quot;Solicitud de eliminación de datos&quot;. Procesaremos tu solicitud en un plazo máximo de 30 días hábiles.
          </p>
          <p>
            También puedes eliminar tu cuenta directamente desde la configuración de tu perfil dentro de la plataforma.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Cookies</h2>
          <p>
            Utilizamos cookies esenciales para mantener tu sesión activa y garantizar el funcionamiento del Servicio.
            No utilizamos cookies de rastreo publicitario de terceros.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Cambios en esta Política</h2>
          <p>
            Podemos actualizar esta Política de Privacidad periódicamente. Publicaremos cualquier cambio en esta
            página y actualizaremos la fecha de &quot;última actualización&quot;. Te recomendamos revisar esta página
            regularmente.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos en:
          </p>
          <ul className="list-none pl-0 space-y-1">
            <li><strong>Email:</strong> <a href="mailto:privacy@apexucode.com" className="text-primary underline">privacy@apexucode.com</a></li>
            <li><strong>Plataforma:</strong> <a href="https://www.apexucode.com" className="text-primary underline">apexucode.com</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
