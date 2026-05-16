// WhatsApp message templates per pedido state.
// They're plain strings (with placeholders) so anyone can tweak them
// without touching the action code.
import type { EstadoPedido, Pedido } from "@/types/pedido";

const PRODUCTO_LABEL: Record<string, string> = {
  rutinas: "Tablero de Rutinas",
  recompensas: "Tablero de Recompensas",
};

// Render the message for a given (pedido, estado) combo. estado is passed
// separately so the operator can preview the message for the *next* status
// before actually committing the change.
export function plantillaWhatsappCliente(pedido: Pedido, estado: EstadoPedido): string {
  const nombre = pedido.nombre_nino ?? "tu niño";
  const producto = PRODUCTO_LABEL[pedido.producto] ?? "tablero";

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
En 2–3 días hábiles te avisamos cuando salga listo para envío.

— Minirutina`
      );
    case "enviado":
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
