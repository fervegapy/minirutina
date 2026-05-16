export type EstadoPedido =
  | "pendiente"      // creado, esperando confirmación de pago
  | "pagado"         // pago confirmado, listo para mandar a imprenta
  | "en_produccion"  // enviado a imprenta
  | "enviado"        // despachado al cliente
  | "entregado";     // confirmado en mano del cliente
export type TipoEntrega = "digital" | "fisico";
export type ProductoTipo = "rutinas" | "recompensas";

export interface Pedido {
  id: string;
  created_at: string;
  producto: ProductoTipo;
  nombre_nino: string;
  color_acento: string;
  personalizacion: PersonalizacionRutinas | PersonalizacionRecompensas;
  tipo_entrega: TipoEntrega;
  contacto: string;
  direccion?: string | null;
  estado: EstadoPedido;
  archivo_url?: string | null;
}

export interface PersonalizacionRutinas {
  manana: string[];
  siesta: string[];
  noche: string[];
}

export interface PersonalizacionRecompensas {
  cantidad: 10 | 20;
  genero?: "nino" | "nina";
  // Legacy fields kept optional for backward compatibility with old pedidos.
  pasos?: number;
  recompensa?: string;
  sticker?: string;
}

export interface Database {
  public: {
    Tables: {
      pedidos: {
        Row: Pedido;
        Insert: Omit<Pedido, "id" | "created_at">;
        Update: Partial<Omit<Pedido, "id" | "created_at">>;
      };
    };
  };
}
