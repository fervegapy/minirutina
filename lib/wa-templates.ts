// WhatsApp message templates per pedido state.
// They're plain strings (with placeholders) so anyone can tweak them
// without touching the action code.
import type { EstadoPedido, Pedido } from "@/types/pedido";
import { extraerNombre } from "@/lib/contacto";

const PRODUCTO_LABEL: Record<string, string> = {
  rutinas: "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
};

// Pickup logistics — edit here if hours or the maps link ever change.
const RETIRO_HORARIO   = "09hs a 17:30hs";
const RETIRO_MAPS_URL  = "https://maps.app.goo.gl/CDVdWmZATfs4WZwX9";

// Render the message for a given (pedido, estado) combo. estado is passed
// separately so the operator can preview the message for the *next* status
// before actually committing the change.
export function plantillaWhatsappCliente(pedido: Pedido, estado: EstadoPedido): string {
  const nombre = pedido.nombre_nino ?? "tu niño";
  const producto = PRODUCTO_LABEL[pedido.producto] ?? "tablero";
  // Same signal used everywhere else (PedidosList badge, "en camino" email):
  // direccion starts with "Pickup — ...". Never expose the address itself —
  // just the maps link, coordinated one-on-one over WhatsApp.
  const esRetiro = (pedido.direccion ?? "").startsWith("Pickup");
  const nombrePadres = extraerNombre(pedido.contacto);
  const saludo = nombrePadres ? `Hola ${nombrePadres.split(" ")[0]},` : "¡Hola!";

  switch (estado) {
    case "pendiente":
      return (
`¡Hola! Recibimos tu pedido del ${producto} para ${nombre}. 🎉
Esperamos la confirmación de tu pago para empezar a producirlo.

Cualquier consulta, estamos por acá. — Minirutina`
      );
    case "pagado":
      return (
`¡Recibimos tu pago, gracias! 💛
Tu ${producto} para ${nombre} ya está en cola de producción. Te avisamos cuando salga de imprenta.

— Minirutina`
      );
    case "en_produccion":
      return (
`Tu ${producto} ya está en imprenta. 🖨️
En 48 horas te avisamos cuando salga listo para envío.

— Minirutina`
      );
    case "enviado":
      if (esRetiro) {
        return (
`${saludo} tu pedido de Minirutina está listo para retirar.
Podés pasar de ${RETIRO_HORARIO}. Te dejamos la ubicación: ${RETIRO_MAPS_URL}

— Minirutina`
        );
      }
      return (
`¡Listo! Tu ${producto} para ${nombre} ya está en camino. 📦
Te aviso al confirmar la entrega.

— Minirutina`
      );
    case "entregado":
      return (
`¡Llegó! 🎉 Espero que ${nombre} disfrute su nuevo ${producto}.
Si te animás a compartir una foto, ¡nos haría feliz! 💛

— Minirutina`
      );
  }
}
