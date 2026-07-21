import type { Metadata } from "next";
import LegalLayout from "@/components/landing/LegalLayout";

export const metadata: Metadata = {
  title:       "Envíos y Devoluciones",
  description: "Tiempos, costos, zonas de cobertura y política de devoluciones de Minirutina.",
};

export default function EnviosPage() {
  return (
    <LegalLayout
      title="Envíos y Devoluciones"
      subtitle="Todo lo que necesitás saber sobre cómo y cuándo te llega tu tablero."
    >
      <h2>Tiempo de producción</h2>
      <p>
        Cada tablero se produce a pedido —no tenemos stock—. El plazo
        estándar de producción es de <strong>48 horas hábiles</strong>
        contadas a partir de la confirmación del pago. En casos puntuales
        (fechas con alta demanda, materiales agotados temporalmente)
        podríamos extenderlo: si eso ocurre, te avisamos por WhatsApp o
        email apenas se confirma el pedido.
      </p>

      <h2>Modalidades de entrega</h2>
      <h3>Retiro en pickup (gratis)</h3>
      <p>
        Podés retirar gratis en nuestra base en <strong>Asunción</strong>.
        Una vez listo el tablero te escribimos por
        WhatsApp para coordinar día y horario. Horario habitual de retiro:
        lunes a viernes de 9 a 18 hs.
      </p>

      <h3>Delivery a domicilio</h3>
      <p>
        El costo de delivery depende de la ciudad de destino y se calcula
        automáticamente en el checkout al elegir la dirección. Tenemos
        zonas configuradas para Asunción y Gran Asunción, y una tarifa
        general para el resto del país. Si tu localidad no aparece o
        querés confirmar el costo antes de ordenar, escribinos a
        <a href="mailto:soporte@minirutina.com"> soporte@minirutina.com</a>.
      </p>

      <h2>Cobertura geográfica</h2>
      <p>
        Hacemos envíos a <strong>todo el Paraguay</strong>. Para envíos
        internacionales escribinos antes de comprar para evaluar costos y
        plazos.
      </p>

      <h2>Seguimiento</h2>
      <p>
        Te mantenemos al tanto en cada etapa por WhatsApp y email:
      </p>
      <ul>
        <li><strong>Pago confirmado</strong> — recibís un email automático.</li>
        <li><strong>En producción</strong> — el tablero entra al taller.</li>
        <li><strong>Enviado / listo para retirar</strong> — te avisamos con los datos del courier (si aplica) o coordinamos pickup.</li>
        <li><strong>Entregado</strong> — el pedido se cierra.</li>
      </ul>

      <h2>Devoluciones</h2>
      <p>
        Como cada tablero es un producto <strong>100% personalizado</strong>
        (nombre del niño, color elegido, íconos seleccionados),
        <strong> no se aceptan devoluciones por arrepentimiento</strong> ni
        cambios por preferencia del cliente. Esta política se aplica a
        productos físicos y digitales por igual.
      </p>

      <h2>Reimpresión sin costo</h2>
      <p>
        Si hubo un error <strong>nuestro</strong> en la producción
        (impresión defectuosa, nombre distinto al confirmado, color erróneo,
        daño durante el envío), reimprimimos el producto sin costo.
        Condiciones:
      </p>
      <ul>
        <li>El reclamo debe ingresar dentro de los <strong>7 días</strong> siguientes a la entrega.</li>
        <li>Escribinos a <a href="mailto:soporte@minirutina.com"> soporte@minirutina.com</a> con fotos claras del defecto y el número de pedido.</li>
        <li>Si el reclamo es válido, te pedimos devolver la pieza defectuosa (con costo de envío a cargo nuestro) o destruirla bajo verificación por foto.</li>
      </ul>

      <h2>Errores de personalización por parte del cliente</h2>
      <p>
        Si hubo un error de escritura en el nombre o en los datos cargados
        en el customizer (cosas que ya estaban antes de confirmar el pago),
        podemos producir un tablero corregido con un descuento del
        <strong> 30%</strong> sobre el precio de lista, dentro de los 7
        días siguientes a la entrega.
      </p>

      <h2>Producto digital</h2>
      <p>
        Para pedidos en versión <strong>digital (PDF)</strong>, el archivo
        se envía por email al confirmar el pago. Por tratarse de un bien
        digital personalizado, no se realizan devoluciones una vez
        entregado el archivo. Si encontrás un problema técnico con el PDF
        (no se abre, está corrupto), escribinos y lo reemitimos sin costo.
      </p>

      <h2>Materiales del tablero impreso</h2>
      <ul>
        <li>Papel couché de <strong>300 g/m²</strong>.</li>
        <li>Plastificado <strong>mate</strong> anti-reflejo de larga duración.</li>
        <li>Tamaño A4 (21 x 29 cm) salvo indicación contraria.</li>
        <li>Listo para colgar con cinta doble faz, imanes de heladera o moldura.</li>
      </ul>

      <h2>Contacto</h2>
      <p>
        ¿Dudas sobre tu envío o un pedido en curso?
        Escribinos a <a href="mailto:soporte@minirutina.com"> soporte@minirutina.com </a>
        o usá el <a href="/contacto">formulario de contacto</a>.
      </p>
    </LegalLayout>
  );
}
