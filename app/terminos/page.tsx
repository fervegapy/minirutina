import type { Metadata } from "next";
import LegalLayout from "@/components/landing/LegalLayout";

export const metadata: Metadata = {
  title:       "Términos y Condiciones",
  description: "Términos y condiciones de uso del servicio de Minirutina.",
};

export default function TerminosPage() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      subtitle="Última actualización: mayo 2026"
    >
      <p>
        Bienvenido a Minirutina. Al acceder y utilizar nuestro sitio web
        <a href="https://minirutina.com"> minirutina.com</a> y los servicios
        ofrecidos a través del mismo, aceptás los presentes Términos y
        Condiciones. Si no estás de acuerdo, por favor no utilices el sitio.
      </p>

      <h2>1. Quiénes somos</h2>
      <p>
        Minirutina es una marca paraguaya dedicada a la producción de
        tableros visuales personalizados para niños (rutinas y recompensas).
        Nuestra base de operaciones se encuentra en Villamorra, Asunción,
        República del Paraguay. Para consultas comerciales o de soporte
        podés escribirnos a
        <a href="mailto:soporte@minirutina.com"> soporte@minirutina.com</a>.
      </p>

      <h2>2. Aceptación de los términos</h2>
      <p>
        Al realizar un pedido a través del sitio o de cualquier otro canal
        de venta de Minirutina, declarás haber leído, entendido y aceptado
        estos Términos y Condiciones, así como nuestra Política de Envíos y
        Devoluciones. Estos términos pueden actualizarse en cualquier
        momento; la versión vigente es la publicada en este sitio.
      </p>

      <h2>3. Cuenta y personalización</h2>
      <p>
        No es necesario registrarse para comprar. Al personalizar un
        tablero, el cliente es responsable de la exactitud de los datos
        que ingresa (nombre del niño, color elegido, íconos seleccionados,
        cantidad de pasos, datos de contacto y dirección de envío).
        Minirutina no se hace responsable por errores derivados de
        información incorrecta o incompleta provista por el cliente.
      </p>

      <h2>4. Precios y forma de pago</h2>
      <p>
        Los precios se muestran en Guaraníes (Gs.) en el sitio. El cobro a
        través de tarjeta se procesa mediante <strong>Stripe</strong> en
        Dólares de los Estados Unidos (USD), utilizando la tasa de cambio
        vigente al momento de la confirmación del pedido. Esa tasa queda
        registrada en cada pedido para referencia.
      </p>
      <p>
        Aceptamos como medios de pago: tarjetas de crédito y débito
        procesadas por Stripe, y métodos alternativos coordinados por
        WhatsApp (transferencia bancaria, billeteras digitales locales).
        El pedido se considera confirmado al recibirse el pago efectivo.
      </p>

      <h2>5. Producción y entrega</h2>
      <p>
        El tiempo estimado de producción es de <strong>48 horas hábiles</strong>
        contadas a partir de la confirmación del pago. Los detalles
        completos de modalidades de entrega (pickup y delivery), zonas y
        costos están en nuestra
        <a href="/envios-y-devoluciones"> Política de Envíos y Devoluciones</a>.
      </p>

      <h2>6. Devoluciones y reimpresiones</h2>
      <p>
        Dado que cada tablero es un producto <strong>100% personalizado</strong>,
        no se aceptan devoluciones por arrepentimiento o por errores en los
        datos provistos por el cliente. Si hubo un error de producción
        atribuible a Minirutina (impresión defectuosa, error en el nombre
        respecto a lo confirmado, daño durante el envío), reimprimimos el
        producto sin costo dentro de los <strong>7 días</strong> siguientes
        a la entrega. Ver detalles en la
        <a href="/envios-y-devoluciones"> Política de Envíos y Devoluciones</a>.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        Todo el contenido del sitio —diseños, ilustraciones, íconos,
        textos, fotografías y la composición visual del tablero— es
        propiedad de Minirutina o cuenta con licencia para su uso.
        El cliente recibe un derecho de uso <strong>personal y no
        comercial</strong> sobre el archivo digital generado para su
        tablero. Queda prohibida la reventa, redistribución o uso
        comercial de los archivos sin autorización expresa.
      </p>

      <h2>8. Datos personales</h2>
      <p>
        Los datos personales recolectados (nombre, email, WhatsApp,
        dirección, nombre del niño) se utilizan exclusivamente para
        procesar el pedido, coordinar la entrega y enviar comunicaciones
        relacionadas. No comercializamos ni cedemos datos a terceros.
        El tratamiento se realiza conforme a la Ley N° 6534/20 de
        Protección de Datos Personales Crediticios y la normativa
        paraguaya aplicable. Podés solicitar la eliminación de tus datos
        escribiéndonos a
        <a href="mailto:soporte@minirutina.com"> soporte@minirutina.com</a>.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        Minirutina hará sus mejores esfuerzos para mantener el sitio
        operativo y los productos en stock, pero no garantiza
        disponibilidad ininterrumpida. No nos hacemos responsables por
        daños indirectos, demoras de servicios de courier externos
        ajenos a nuestro control, ni por mal uso del producto físico.
      </p>

      <h2>10. Modificaciones</h2>
      <p>
        Podemos modificar estos términos en cualquier momento publicando
        la nueva versión en esta misma página. La fecha de
        &quot;Última actualización&quot; al principio refleja la versión
        vigente.
      </p>

      <h2>11. Ley aplicable y jurisdicción</h2>
      <p>
        Estos Términos se rigen por las leyes de la República del Paraguay.
        Cualquier controversia será sometida a los tribunales ordinarios
        de la ciudad de Asunción, renunciando las partes a cualquier otro
        fuero que pudiera corresponder.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para cualquier consulta sobre estos Términos, escribinos a
        <a href="mailto:soporte@minirutina.com"> soporte@minirutina.com </a>
        o usá el <a href="/contacto">formulario de contacto</a>.
      </p>
    </LegalLayout>
  );
}
