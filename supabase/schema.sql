CREATE TABLE pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  producto TEXT NOT NULL,
  nombre_nino TEXT NOT NULL,
  color_acento TEXT NOT NULL,
  personalizacion JSONB NOT NULL,
  tipo_entrega TEXT NOT NULL,
  contacto TEXT NOT NULL,
  direccion TEXT,
  estado TEXT DEFAULT 'pendiente',
  archivo_url TEXT
);
