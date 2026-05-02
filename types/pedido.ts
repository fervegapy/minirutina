export type EstadoPedido = "pendiente" | "pagado" | "enviado";
export type TipoEntrega = "digital" | "fisico";
export type ProductoTipo = "rutinas" | "semana" | "recompensas";

export interface Pedido {
  id: string;
  created_at: string;
  producto: ProductoTipo;
  nombre_nino: string;
  color_acento: string;
  personalizacion: PersonalizacionRutinas | PersonalizacionSemana | PersonalizacionRecompensas;
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

export interface PersonalizacionSemana {
  lunes: string[];
  martes: string[];
  miercoles: string[];
  jueves: string[];
  viernes: string[];
  sabado: string[];
  domingo: string[];
}

export interface PersonalizacionRecompensas {
  pasos: number;
  recompensa: string;
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
