const supabaseUrl = 'https://thyxhystomblrimokbxi.supabase.co';
const supabaseKey = 'sb_publishable_vgMlqThxJJUydyn1wDQiMA_mF4VqYp8';
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

export const URL_BUCKET_PRODUTOS =
  'https://thyxhystomblrimokbxi.supabase.co/storage/v1/object/public/produtos%20happy%20kids/';

// Estes números são públicos e usados somente para montar links wa.me.
// Chaves administrativas ou service_role nunca devem ser adicionadas ao cliente.
export const NUMEROS_WHATSAPP = Object.freeze({
  principal: '558130463443',
  filialGaranhuns: '5587991384045'
});
