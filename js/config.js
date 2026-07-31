const supabaseUrl = 'https://thyxhystomblrimokbxi.supabase.co';
const supabaseKey = 'sb_publishable_vgMlqThxJJUydyn1wDQiMA_mF4VqYp8';
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

export const URL_BUCKET_PRODUTOS =
    'https://thyxhystomblrimokbxi.supabase.co/storage/v1/object/public/produtos%20happy%20kids/';

// Número do WhatsApp da loja (usado no orçamento de favoritos).
// Antes estava hardcoded dentro de ui.js, dentro da função enviarOrcamentoWhatsApp
// — mas é configuração do negócio, não lógica de apresentação. Se o número mudar
// um dia, essa é a ÚNICA linha que precisa mudar.
export const NUMERO_WHATSAPP = '558130463443';