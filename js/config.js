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

// Códigos dos produtos que aparecem nos 3 cards de destaque do menu ("Nossos
// Destaques"). Escolha manual — troque os números abaixo pelos códigos reais
// dos produtos que você quer destacar (mais vendido, promoção, lançamento,
// o que fizer sentido no momento). Pode ter menos de 3 códigos, se quiser.

//export const CODIGOS_DESTAQUES_MENU = [4091, 2702, 2698];
