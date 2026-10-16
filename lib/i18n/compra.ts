// Textos del flujo de compra por idioma: customizers, checkout, confirmación
// y el PDF. El email de pedido confirmado tiene los suyos en
// lib/emails/textos.ts (es código de servidor).
//
// Se sirve en español en la raíz (/personalizar/…, /checkout, /confirmacion)
// y con prefijo en /en/… y /pt/… (ver middleware.ts y app/[locale]/). Acá el
// español es el de siempre, con voseo: es el que ya ve Paraguay.
import type { Locale } from "@/lib/i18n";

// ─── Nombres de producto ─────────────────────────────────────────────────────
const PRODUCTO: Record<Locale, Record<string, string>> = {
  es: { rutinas: "Tablero de Rutinas", recompensas: "Tablero de Recompensas", semana: "Plan de la Semana" },
  en: { rutinas: "Routine Chart", recompensas: "Reward Chart", semana: "Weekly Plan" },
  pt: { rutinas: "Quadro de Rotinas", recompensas: "Quadro de Recompensas", semana: "Plano da Semana" },
};

export function nombreProducto(producto: string, locale: Locale = "es"): string {
  return PRODUCTO[locale][producto] ?? PRODUCTO.es[producto] ?? producto;
}

// ─── Actividades (íconos) ────────────────────────────────────────────────────
// La etiqueta en español vive en ICONOS_* (components/customizer/IconPicker).
// Se usa como alt de la imagen; el texto que se ve está dibujado en el PNG
// (public/icons/<idioma>/, ver scripts/traducir-imagenes.py).
export const ACTIVIDADES: Record<Exclude<Locale, "es">, Record<string, string>> = {
  en: {
    levantarse: "Get up", cama: "Make the bed", ir_bano: "Use the bathroom", bano: "Take a bath",
    cepillo: "Brush teeth", peinarse: "Brush hair", vestirse: "Get dressed", zapatos: "Put on shoes",
    desayunar: "Eat breakfast", manos: "Wash hands", agua: "Drink water", remedios: "Medicine",
    ordenar: "Tidy up", calendario: "Calendar", mochila: "Backpack", leer: "Read", orar: "Pray",
    guarde: "Go to daycare", cole: "Go to school", almuerzo: "Lunch", siesta: "Nap", lectura: "Read",
    juego: "Play", tarea: "Homework", merienda: "Snack", tv: "TV", dibujo: "Draw",
    mamallega: "Mom comes home", papallega: "Dad comes home", papamamallegan: "Mom and dad come home",
    cena: "Dinner", cara: "Wash face", pijama: "Pajamas", cepillarse: "Brush teeth", leche: "Milk",
    calma: "Quiet time", cuento: "Story", cancion: "Song", charla: "Talk about the day",
    preparar: "Get ready for tomorrow", luces: "Lights out", dormir: "Sleep",
  },
  pt: {
    levantarse: "Levantar", cama: "Arrumar a cama", ir_bano: "Ir ao banheiro", bano: "Tomar banho",
    cepillo: "Escovar os dentes", peinarse: "Pentear o cabelo", vestirse: "Se vestir", zapatos: "Calçar os sapatos",
    desayunar: "Tomar café da manhã", manos: "Lavar as mãos", agua: "Beber água", remedios: "Remédio",
    ordenar: "Arrumar as coisas", calendario: "Calendário", mochila: "Mochila", leer: "Ler", orar: "Orar",
    guarde: "Ir para a creche", cole: "Ir para a escola", almuerzo: "Almoço", siesta: "Soneca", lectura: "Ler",
    juego: "Brincar", tarea: "Lição de casa", merienda: "Lanche", tv: "TV", dibujo: "Desenhar",
    mamallega: "Mamãe chega", papallega: "Papai chega", papamamallegan: "Papai e mamãe chegam",
    cena: "Jantar", cara: "Lavar o rosto", pijama: "Pijama", cepillarse: "Escovar os dentes", leche: "Leite",
    calma: "Momento de calma", cuento: "História", cancion: "Música", charla: "Conversa do dia",
    preparar: "Preparar para amanhã", luces: "Apagar as luzes", dormir: "Dormir",
  },
};

// ─── Customizers ─────────────────────────────────────────────────────────────
export interface PasoMeta { title: string; sub: (nombre: string) => string }

export interface CustomizerDict {
  pasoDe:            (n: number, total: number) => string;
  placeholderNombre: string;
  esNinoONina:       string;
  nino:              string;
  nina:              string;
  colores:           Record<string, string>;   // hex → nombre (aria-label)
  generando:         string;
  cargandoPreview:   string;
  errorPdf:          string;
  errorDesconocido:  string;
  reintentar:        string;
  marcaDeAgua:       string;
  atras:             string;
  siguiente:         string;
  continuarPago:     string;
  rutinas: {
    tituloTablero: (nombre: string) => string;
    pasos:         string[];
    meta:          (requeridos: number) => PasoMeta[];
    faltan:        (requeridos: number, llevas: number) => string;
  };
  recompensas: {
    tituloTablero: (nombre: string) => string;
    pasos:         string[];
    meta:          PasoMeta[];
    pasosUnidad:   string;
    stickers:      Record<string, string>;
  };
}

const CUSTOMIZER: Record<Locale, CustomizerDict> = {
  es: {
    pasoDe: (n, t) => `Paso ${n} de ${t}`,
    placeholderNombre: "Nombre del niño/a",
    esNinoONina: "¿Es niño o niña?",
    nino: "Niño",
    nina: "Niña",
    colores: { "#a8c5a0": "Verde salvia", "#e8b4b8": "Rosa polvoso", "#a8c8e8": "Azul cielo", "#f5d78e": "Amarillo cálido" },
    generando: "Generando tu tablero...",
    cargandoPreview: "Cargando vista previa...",
    errorPdf: "No se pudo generar el PDF",
    errorDesconocido: "Error desconocido",
    reintentar: "Reintentar",
    marcaDeAgua: "🔒 Vista previa con marca de agua. La versión final y limpia se descarga después del pago.",
    atras: "Atrás",
    siguiente: "Siguiente",
    continuarPago: "Continuar al pago",
    rutinas: {
      tituloTablero: (n) => `Tablero de Rutinas de ${n || "tu niño"}`,
      pasos: ["Nombre", "Color", "Mañana", "Noche", "Vista previa"],
      meta: (r) => [
        { title: "Contanos el nombre", sub: () => "Y si es niño o niña, para personalizar los íconos" },
        { title: "Elegí el color", sub: () => "Va a teñir la banda y los detalles del tablero" },
        { title: `Elegí ${r} actividades de la mañana`, sub: () => "Tocá en el orden que querés que aparezcan" },
        { title: `Elegí ${r} actividades de la noche`, sub: () => "Tocá en el orden que querés que aparezcan" },
        { title: "Mirá tu tablero", sub: (n) => `Así va a quedar el de ${n || "tu niño"} · si te gusta, seguís al pago` },
      ],
      faltan: (r, l) => `Tenés que elegir ${r} actividades (llevás ${l}).`,
    },
    recompensas: {
      tituloTablero: (n) => `Tablero de Recompensas de ${n || "tu niño"}`,
      pasos: ["Nombre", "Cantidad", "Sticker", "Vista previa"],
      meta: [
        { title: "Contanos el nombre", sub: () => "Y si es niño o niña, para personalizar los íconos" },
        { title: "¿Cuántos pasos va a tener?", sub: () => "Es la cantidad de stickers que junta hasta llegar a la recompensa" },
        { title: "Elegí el sticker", sub: () => "Es el que se pega cada vez que cumple un paso" },
        { title: "Mirá tu tablero", sub: (n) => `Así va a quedar el de ${n || "tu niño"} · si te gusta, seguís al pago` },
      ],
      pasosUnidad: "pasos",
      stickers: { estrella: "Estrella", check: "Check", corazon: "Corazón", brillante: "Estrella con carita" },
    },
  },
  en: {
    pasoDe: (n, t) => `Step ${n} of ${t}`,
    placeholderNombre: "Child's name",
    esNinoONina: "Boy or girl?",
    nino: "Boy",
    nina: "Girl",
    colores: { "#a8c5a0": "Sage green", "#e8b4b8": "Dusty pink", "#a8c8e8": "Sky blue", "#f5d78e": "Warm yellow" },
    generando: "Creating your chart...",
    cargandoPreview: "Loading preview...",
    errorPdf: "We couldn't create the PDF",
    errorDesconocido: "Unknown error",
    reintentar: "Try again",
    marcaDeAgua: "🔒 Watermarked preview. The clean final version is ready to download after payment.",
    atras: "Back",
    siguiente: "Next",
    continuarPago: "Continue to payment",
    rutinas: {
      tituloTablero: (n) => (n ? `${n}'s Routine Chart` : "Your child's Routine Chart"),
      pasos: ["Name", "Color", "Morning", "Bedtime", "Preview"],
      meta: (r) => [
        { title: "Tell us their name", sub: () => "And whether it's a boy or a girl, to personalize the icons" },
        { title: "Pick a color", sub: () => "It tints the band and the details of the chart" },
        { title: `Pick ${r} morning activities`, sub: () => "Tap them in the order you want them to appear" },
        { title: `Pick ${r} bedtime activities`, sub: () => "Tap them in the order you want them to appear" },
        { title: "Here's your chart", sub: (n) => `This is how ${n ? `${n}'s` : "your child's"} chart will look · if you like it, continue to payment` },
      ],
      faltan: (r, l) => `You need to pick ${r} activities (you have ${l}).`,
    },
    recompensas: {
      tituloTablero: (n) => (n ? `${n}'s Reward Chart` : "Your child's Reward Chart"),
      pasos: ["Name", "Steps", "Sticker", "Preview"],
      meta: [
        { title: "Tell us their name", sub: () => "And whether it's a boy or a girl, to personalize the icons" },
        { title: "How many steps?", sub: () => "The number of stickers they collect to reach the reward" },
        { title: "Pick the sticker", sub: () => "The one they stick on every time they complete a step" },
        { title: "Here's your chart", sub: (n) => `This is how ${n ? `${n}'s` : "your child's"} chart will look · if you like it, continue to payment` },
      ],
      pasosUnidad: "steps",
      stickers: { estrella: "Star", check: "Check", corazon: "Heart", brillante: "Smiling star" },
    },
  },
  pt: {
    pasoDe: (n, t) => `Passo ${n} de ${t}`,
    placeholderNombre: "Nome da criança",
    esNinoONina: "É menino ou menina?",
    nino: "Menino",
    nina: "Menina",
    colores: { "#a8c5a0": "Verde sálvia", "#e8b4b8": "Rosa antigo", "#a8c8e8": "Azul céu", "#f5d78e": "Amarelo quente" },
    generando: "Criando seu quadro...",
    cargandoPreview: "Carregando a prévia...",
    errorPdf: "Não foi possível gerar o PDF",
    errorDesconocido: "Erro desconhecido",
    reintentar: "Tentar de novo",
    marcaDeAgua: "🔒 Prévia com marca d'água. A versão final, sem marca, fica disponível para download depois do pagamento.",
    atras: "Voltar",
    siguiente: "Próximo",
    continuarPago: "Continuar para o pagamento",
    rutinas: {
      tituloTablero: (n) => `Quadro de Rotinas de ${n || "seu filho"}`,
      pasos: ["Nome", "Cor", "Manhã", "Noite", "Prévia"],
      meta: (r) => [
        { title: "Conte o nome", sub: () => "E se é menino ou menina, para personalizar os ícones" },
        { title: "Escolha a cor", sub: () => "Ela colore a faixa e os detalhes do quadro" },
        { title: `Escolha ${r} atividades da manhã`, sub: () => "Toque na ordem em que você quer que apareçam" },
        { title: `Escolha ${r} atividades da noite`, sub: () => "Toque na ordem em que você quer que apareçam" },
        { title: "Veja seu quadro", sub: (n) => `Assim vai ficar o quadro de ${n || "seu filho"} · se gostar, siga para o pagamento` },
      ],
      faltan: (r, l) => `Você precisa escolher ${r} atividades (escolheu ${l}).`,
    },
    recompensas: {
      tituloTablero: (n) => `Quadro de Recompensas de ${n || "seu filho"}`,
      pasos: ["Nome", "Passos", "Figurinha", "Prévia"],
      meta: [
        { title: "Conte o nome", sub: () => "E se é menino ou menina, para personalizar os ícones" },
        { title: "Quantos passos vai ter?", sub: () => "É a quantidade de figurinhas que a criança junta até chegar à recompensa" },
        { title: "Escolha a figurinha", sub: () => "É a que se cola cada vez que um passo é cumprido" },
        { title: "Veja seu quadro", sub: (n) => `Assim vai ficar o quadro de ${n || "seu filho"} · se gostar, siga para o pagamento` },
      ],
      pasosUnidad: "passos",
      stickers: { estrella: "Estrela", check: "Check", corazon: "Coração", brillante: "Estrela sorridente" },
    },
  },
};

export function getCustomizerDict(locale: Locale): CustomizerDict {
  return CUSTOMIZER[locale];
}

// ─── Checkout ────────────────────────────────────────────────────────────────
export interface CheckoutDict {
  cargandoMapa:      string;
  cuponInvalido:     string;
  cuponNoValidado:   string;
  carritoVacio:      string;
  errNombre:         string;
  errEmail:          string;
  errWhatsapp:       string;
  errFactura:        string;
  errDepto:          string;
  errCalle:          string;
  errGuardar:        string;
  errItems:          string;
  errPago:           string;
  errIniciarPago:    string;
  errPagoReintentar: string;
  vacioTitulo:       string;
  vacioSub:          string;
  redirigiendo:      string;
  redirigiendoSub:   string;
  confirma:          string;
  unPaso:            (n: number) => string;
  cancelado:         string;
  tuCarrito:         (n: number) => string;
  agregarOtro:       string;
  queAgregar:        string;
  rutinasCorto:      string;
  rutinasSub:        string;
  recompensasCorto:  string;
  recompensasSub:    string;
  cancelar:          string;
  pickupODelivery:   string;
  pickupDesc:        string;
  desde:             string;
  deliveryDesc:      string;
  aDonde:            string;
  referencia:        string;
  zona:              string;
  envio:             string;
  tusDatos:          string;
  nombre:            string;
  apellido:          string;
  email:             string;
  whatsappIntl:      string;
  whatsappPy:        string;
  contactoWhatsapp:  string;
  factura:           string;
  razonSocial:       string;
  tenesCupon:        string;
  opcional:          string;
  quitar:            string;
  codigoCupon:       string;
  aplicar:           string;
  pagaTarjeta:       string;
  titularTarjeta:    string;
  subtotal:          (n: number) => string;
  cupon:             string;
  total:             string;
  procesando:        string;
  pagar:             string;
  irAPagar:          string;
  faltaNombre:       string;
  faltaEmail:        string;
  faltaWhatsapp:     string;
  faltaDireccion:    string;
  faltaFactura:      string;
  noALaVenta:        string;
  completaDatos:     string;
  resumenRutinas:    (m: number, n: number) => string;
  resumenRecompensas:(n: number) => string;
  para:              string;
  eliminar:          string;
  digitalPdf:        string;
  impreso:           string;
  digital:           string;
  descripcionPago:   (producto: string, nino: string) => string;
  descripcionVarios: (n: number, ninos: string) => string;
}

const CHECKOUT: Record<Locale, CheckoutDict> = {
  es: {
    cargandoMapa: "Cargando mapa…",
    cuponInvalido: "Cupón inválido.",
    cuponNoValidado: "No se pudo validar el cupón.",
    carritoVacio: "Tu carrito está vacío.",
    errNombre: "Ingresá tu nombre y apellido.",
    errEmail: "Ingresá un email válido.",
    errWhatsapp: "Ingresá un número de WhatsApp válido.",
    errFactura: "Completá RUC y Razón Social para la factura.",
    errDepto: "Seleccioná departamento y ciudad.",
    errCalle: "Completá calle y número.",
    errGuardar: "Hubo un error al guardar tu pedido. Intentá de nuevo.",
    errItems: "Hubo un error al guardar los items del pedido.",
    errPago: "No se pudo procesar el pago.",
    errIniciarPago: "No se pudo iniciar el pago.",
    errPagoReintentar: "No se pudo procesar el pago. Intentá de nuevo.",
    vacioTitulo: "Tu carrito está vacío",
    vacioSub: "Empezá personalizando un tablero — podés agregar varios y pagarlos juntos.",
    redirigiendo: "Redirigiendo a la pasarela de pago...",
    redirigiendoSub: "Puede tardar unos segundos según tu conexión. No cierres ni recargues la página.",
    confirma: "Confirmá tu pedido",
    unPaso: (n) => (n === 1 ? "Estás a un paso de tener tu tablero" : `Estás a un paso de tener tus ${n} tableros`),
    cancelado: "Cancelaste el pago. Tu carrito sigue acá — completá el formulario abajo para reintentar.",
    tuCarrito: (n) => `Tu carrito · ${n} ${n === 1 ? "tablero" : "tableros"}`,
    agregarOtro: "Agregar otro tablero",
    queAgregar: "¿Qué tablero querés agregar?",
    rutinasCorto: "Rutinas",
    rutinasSub: "Día + noche",
    recompensasCorto: "Recompensas",
    recompensasSub: "10 o 20 pasos",
    cancelar: "Cancelar",
    pickupODelivery: "¿Pickup o delivery?",
    pickupDesc: "Retirás en Asunción — te pasamos la ubicación exacta por WhatsApp.",
    desde: "desde",
    deliveryDesc: "A tu puerta. Se ajusta según tu ciudad.",
    aDonde: "Decinos a dónde te lo llevamos",
    referencia: "Referencia (opcional — ej. portón verde)",
    zona: "Zona",
    envio: "Envío",
    tusDatos: "Dejanos tus datos",
    nombre: "Nombre",
    apellido: "Apellido",
    email: "Email",
    whatsappIntl: "WhatsApp (con código de país)",
    whatsappPy: "WhatsApp (ej: +595 981 123456)",
    contactoWhatsapp: "Te contactamos por WhatsApp para confirmar y coordinar tu pedido.",
    factura: "¿Necesitás factura?",
    razonSocial: "Razón social",
    tenesCupon: "¿Tenés un cupón?",
    opcional: "opcional",
    quitar: "Quitar",
    codigoCupon: "Código de cupón",
    aplicar: "Aplicar",
    pagaTarjeta: "Pagá con tu tarjeta",
    titularTarjeta: "Nombre del titular de la tarjeta",
    subtotal: (n) => `Subtotal (${n} ${n === 1 ? "item" : "items"})`,
    cupon: "Cupón",
    total: "Total",
    procesando: "Procesando...",
    pagar: "Pagar",
    irAPagar: "Ir a pagar",
    faltaNombre: "Completá tu nombre y apellido",
    faltaEmail: "Ingresá un email válido",
    faltaWhatsapp: "Ingresá tu número de WhatsApp",
    faltaDireccion: "Completá la dirección de entrega",
    faltaFactura: "Completá RUC y razón social",
    noALaVenta: "Este tablero todavía no está a la venta en tu país",
    completaDatos: "Completá los datos para continuar",
    resumenRutinas: (m, n) => `${m} actividades de mañana · ${n} de noche`,
    resumenRecompensas: (n) => `${n} pasos`,
    para: "Para",
    eliminar: "Eliminar",
    digitalPdf: "Digital (PDF)",
    impreso: "Impreso",
    digital: "Digital",
    descripcionPago: (p, n) => `${p} — ${n}`,
    descripcionVarios: (n, ninos) => `${n} tableros (${ninos})`,
  },
  en: {
    cargandoMapa: "Loading map…",
    cuponInvalido: "Invalid coupon.",
    cuponNoValidado: "We couldn't check the coupon.",
    carritoVacio: "Your cart is empty.",
    errNombre: "Enter your first and last name.",
    errEmail: "Enter a valid email.",
    errWhatsapp: "Enter a valid WhatsApp number.",
    errFactura: "Fill in RUC and company name for the invoice.",
    errDepto: "Select department and city.",
    errCalle: "Fill in street and number.",
    errGuardar: "Something went wrong saving your order. Please try again.",
    errItems: "Something went wrong saving the items of your order.",
    errPago: "We couldn't process the payment.",
    errIniciarPago: "We couldn't start the payment.",
    errPagoReintentar: "We couldn't process the payment. Please try again.",
    vacioTitulo: "Your cart is empty",
    vacioSub: "Start by personalizing a chart — you can add several and pay for them together.",
    redirigiendo: "Taking you to the payment page...",
    redirigiendoSub: "It may take a few seconds depending on your connection. Don't close or reload the page.",
    confirma: "Confirm your order",
    unPaso: (n) => (n === 1 ? "You're one step away from your chart" : `You're one step away from your ${n} charts`),
    cancelado: "You canceled the payment. Your cart is still here — fill in the form below to try again.",
    tuCarrito: (n) => `Your cart · ${n} ${n === 1 ? "chart" : "charts"}`,
    agregarOtro: "Add another chart",
    queAgregar: "Which chart do you want to add?",
    rutinasCorto: "Routines",
    rutinasSub: "Morning + bedtime",
    recompensasCorto: "Rewards",
    recompensasSub: "10 or 20 steps",
    cancelar: "Cancel",
    pickupODelivery: "Pickup or delivery?",
    pickupDesc: "Pick it up in Asunción — we'll send you the exact location on WhatsApp.",
    desde: "from",
    deliveryDesc: "To your door. The price depends on your city.",
    aDonde: "Where should we deliver it?",
    referencia: "Reference (optional — e.g. green gate)",
    zona: "Zone",
    envio: "Delivery",
    tusDatos: "Your details",
    nombre: "First name",
    apellido: "Last name",
    email: "Email",
    whatsappIntl: "WhatsApp (with country code)",
    whatsappPy: "WhatsApp (e.g. +595 981 123456)",
    contactoWhatsapp: "We'll contact you on WhatsApp to confirm and arrange your order.",
    factura: "Need an invoice?",
    razonSocial: "Company name",
    tenesCupon: "Have a coupon?",
    opcional: "optional",
    quitar: "Remove",
    codigoCupon: "Coupon code",
    aplicar: "Apply",
    pagaTarjeta: "Pay by card",
    titularTarjeta: "Name on card",
    subtotal: (n) => `Subtotal (${n} ${n === 1 ? "item" : "items"})`,
    cupon: "Coupon",
    total: "Total",
    procesando: "Processing...",
    pagar: "Pay",
    irAPagar: "Go to payment",
    faltaNombre: "Fill in your first and last name",
    faltaEmail: "Enter a valid email",
    faltaWhatsapp: "Enter your WhatsApp number",
    faltaDireccion: "Fill in the delivery address",
    faltaFactura: "Fill in RUC and company name",
    noALaVenta: "This chart isn't available in your country yet",
    completaDatos: "Fill in your details to continue",
    resumenRutinas: (m, n) => `${m} morning activities · ${n} bedtime`,
    resumenRecompensas: (n) => `${n} steps`,
    para: "For",
    eliminar: "Remove",
    digitalPdf: "Digital (PDF)",
    impreso: "Printed",
    digital: "Digital",
    descripcionPago: (p, n) => `${p} — ${n}`,
    descripcionVarios: (n, ninos) => `${n} charts (${ninos})`,
  },
  pt: {
    cargandoMapa: "Carregando o mapa…",
    cuponInvalido: "Cupom inválido.",
    cuponNoValidado: "Não foi possível validar o cupom.",
    carritoVacio: "Seu carrinho está vazio.",
    errNombre: "Informe seu nome e sobrenome.",
    errEmail: "Informe um e-mail válido.",
    errWhatsapp: "Informe um número de WhatsApp válido.",
    errFactura: "Preencha RUC e razão social para a nota fiscal.",
    errDepto: "Selecione departamento e cidade.",
    errCalle: "Preencha rua e número.",
    errGuardar: "Houve um erro ao salvar seu pedido. Tente de novo.",
    errItems: "Houve um erro ao salvar os itens do pedido.",
    errPago: "Não foi possível processar o pagamento.",
    errIniciarPago: "Não foi possível iniciar o pagamento.",
    errPagoReintentar: "Não foi possível processar o pagamento. Tente de novo.",
    vacioTitulo: "Seu carrinho está vazio",
    vacioSub: "Comece personalizando um quadro — você pode adicionar vários e pagar todos juntos.",
    redirigiendo: "Levando você para a página de pagamento...",
    redirigiendoSub: "Pode levar alguns segundos, dependendo da sua conexão. Não feche nem recarregue a página.",
    confirma: "Confirme seu pedido",
    unPaso: (n) => (n === 1 ? "Falta só um passo para ter seu quadro" : `Falta só um passo para ter seus ${n} quadros`),
    cancelado: "Você cancelou o pagamento. Seu carrinho continua aqui — preencha o formulário abaixo para tentar de novo.",
    tuCarrito: (n) => `Seu carrinho · ${n} ${n === 1 ? "quadro" : "quadros"}`,
    agregarOtro: "Adicionar outro quadro",
    queAgregar: "Qual quadro você quer adicionar?",
    rutinasCorto: "Rotinas",
    rutinasSub: "Manhã + noite",
    recompensasCorto: "Recompensas",
    recompensasSub: "10 ou 20 passos",
    cancelar: "Cancelar",
    pickupODelivery: "Retirada ou entrega?",
    pickupDesc: "Retire em Assunção — enviamos a localização exata pelo WhatsApp.",
    desde: "a partir de",
    deliveryDesc: "Na sua porta. O valor depende da sua cidade.",
    aDonde: "Onde entregamos?",
    referencia: "Referência (opcional — ex.: portão verde)",
    zona: "Zona",
    envio: "Entrega",
    tusDatos: "Seus dados",
    nombre: "Nome",
    apellido: "Sobrenome",
    email: "E-mail",
    whatsappIntl: "WhatsApp (com código do país)",
    whatsappPy: "WhatsApp (ex.: +595 981 123456)",
    contactoWhatsapp: "Entramos em contato pelo WhatsApp para confirmar e combinar seu pedido.",
    factura: "Precisa de nota fiscal?",
    razonSocial: "Razão social",
    tenesCupon: "Tem um cupom?",
    opcional: "opcional",
    quitar: "Remover",
    codigoCupon: "Código do cupom",
    aplicar: "Aplicar",
    pagaTarjeta: "Pague com cartão",
    titularTarjeta: "Nome do titular do cartão",
    subtotal: (n) => `Subtotal (${n} ${n === 1 ? "item" : "itens"})`,
    cupon: "Cupom",
    total: "Total",
    procesando: "Processando...",
    pagar: "Pagar",
    irAPagar: "Ir para o pagamento",
    faltaNombre: "Preencha seu nome e sobrenome",
    faltaEmail: "Informe um e-mail válido",
    faltaWhatsapp: "Informe seu número de WhatsApp",
    faltaDireccion: "Preencha o endereço de entrega",
    faltaFactura: "Preencha RUC e razão social",
    noALaVenta: "Este quadro ainda não está à venda no seu país",
    completaDatos: "Preencha os dados para continuar",
    resumenRutinas: (m, n) => `${m} atividades da manhã · ${n} da noite`,
    resumenRecompensas: (n) => `${n} passos`,
    para: "Para",
    eliminar: "Remover",
    digitalPdf: "Digital (PDF)",
    impreso: "Impresso",
    digital: "Digital",
    descripcionPago: (p, n) => `${p} — ${n}`,
    descripcionVarios: (n, ninos) => `${n} quadros (${ninos})`,
  },
};

export function getCheckoutDict(locale: Locale): CheckoutDict {
  return CHECKOUT[locale];
}

// ─── Confirmación ────────────────────────────────────────────────────────────
export interface ConfirmacionDict {
  titulo:       (nino: string | null) => string;
  pagoOk:       string;
  fallback:     string;
  cuerpo:       string;
  cuerpoDigital:string;
  volver:       string;
}

const CONFIRMACION: Record<Locale, ConfirmacionDict> = {
  es: {
    titulo: (n) => `¡Listo! El tablero de ${n ?? "tu niño"} ya está en proceso.`,
    pagoOk: "Pago confirmado",
    fallback: "Tu pedido fue grabado. No pudimos abrir la página de pago — te escribimos por WhatsApp en breve para coordinar.",
    cuerpo: "Recibimos tu pedido y empezamos a prepararlo. Te avisamos por WhatsApp y email cuando esté listo para enviar.",
    cuerpoDigital: "Recibimos tu pedido. En unos minutos te llega el tablero por email, listo para imprimir.",
    volver: "Volver al inicio",
  },
  en: {
    titulo: (n) => `All set! ${n ? `${n}'s` : "Your child's"} chart is on its way.`,
    pagoOk: "Payment confirmed",
    fallback: "Your order was saved. We couldn't open the payment page — we'll message you on WhatsApp shortly to sort it out.",
    cuerpo: "We got your order and started preparing it. We'll let you know on WhatsApp and by email when it's ready to ship.",
    cuerpoDigital: "We got your order. Your chart will arrive by email in a few minutes, ready to print.",
    volver: "Back to home",
  },
  pt: {
    titulo: (n) => `Pronto! O quadro de ${n ?? "seu filho"} já está a caminho.`,
    pagoOk: "Pagamento confirmado",
    fallback: "Seu pedido foi salvo. Não conseguimos abrir a página de pagamento — vamos falar com você pelo WhatsApp em breve.",
    cuerpo: "Recebemos seu pedido e começamos a prepará-lo. Avisamos pelo WhatsApp e por e-mail quando estiver pronto para envio.",
    cuerpoDigital: "Recebemos seu pedido. Em alguns minutos o quadro chega no seu e-mail, pronto para imprimir.",
    volver: "Voltar ao início",
  },
};

export function getConfirmacionDict(locale: Locale): ConfirmacionDict {
  return CONFIRMACION[locale];
}

// ─── PDF ─────────────────────────────────────────────────────────────────────
// Textos que se escriben en el tablero. Lo que está dibujado en las imágenes
// se resuelve eligiendo el PNG del idioma (lib/pdfImages.ts).
export interface PdfTextos {
  vistaPrevia:   string;
  manana:        string;
  noche:         string;
  tableroDe:     string;
  ninoFallback:  string;
  miRecompensa:  string;
  comienzaAqui:  string;
  loLograste:    string;
}

const PDF: Record<Locale, PdfTextos> = {
  es: {
    vistaPrevia: "VISTA PREVIA", manana: "rutina al despertar", noche: "rutina nocturna",
    tableroDe: "tablero de", ninoFallback: "tu niño", miRecompensa: "mi recompensa",
    comienzaAqui: "comienza aquí  →", loLograste: "¡LO LOGRASTE!",
  },
  en: {
    vistaPrevia: "PREVIEW", manana: "morning routine", noche: "bedtime routine",
    tableroDe: "chart for", ninoFallback: "your child", miRecompensa: "my reward",
    comienzaAqui: "start here  →", loLograste: "YOU DID IT!",
  },
  pt: {
    vistaPrevia: "PRÉVIA", manana: "rotina da manhã", noche: "rotina da noite",
    tableroDe: "quadro de", ninoFallback: "seu filho", miRecompensa: "minha recompensa",
    comienzaAqui: "comece aqui  →", loLograste: "VOCÊ CONSEGUIU!",
  },
};

export function getPdfTextos(locale: Locale = "es"): PdfTextos {
  return PDF[locale] ?? PDF.es;
}
