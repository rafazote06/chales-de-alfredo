/* =============================================================
   Chalés de Alfredo — configuração do site
   Altere apenas este arquivo para trocar telefone, endereço,
   redes sociais e regras de preço. Nada aqui depende de build.
   ============================================================= */

window.CONFIG = {
  marca: 'Chalés de Alfredo',

  /* ---------------------------------------------------------
     WhatsApp
     numero: somente dígitos, com DDI 55 + DDD. PLACEHOLDER —
     substituir pelo número real antes de publicar.
     --------------------------------------------------------- */
  whatsapp: {
    numero: '5548998422966',
    numeroExibicao: '(48) 99842-2966',
    mensagemPadrao:
      'Olá! Vim pelo site dos Chalés de Alfredo e gostaria de tirar uma dúvida sobre a hospedagem.'
  },

  /* Contato geral */
  contato: {
    telefoneExibicao: '(48) 99842-2966',
    endereco: {
      linha1: 'Estrada Geral Rio Adaga',
      linha2: 'Alfredo Wagner — SC',
      complemento: 'Alfredo Wagner — SC, CEP 88450-000',
      referencia: 'CEP 88450-000'
    },
    horarios: {
      checkin: '14h',
      checkout: '12h',
      recepcao: 'Recepção das 8h às 20h, todos os dias'
    }
  },

  redes: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    youtube: 'https://youtube.com/'
  },

  /* ---------------------------------------------------------
     Supabase
     anonKey é uma chave pública (protegida por Row Level Security
     no banco, não por sigilo) — pode ficar aqui no front-end.
     Bucket de fotos: "chales" (público, leitura livre).
     --------------------------------------------------------- */
  supabase: {
    url: 'https://dhfnoqdjedcjvzuquzva.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZm5vcWRqZWRjanZ6dXF1enZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzc5MTQsImV4cCI6MjA5Mjk1MzkxNH0.UmQ3NsmWWohrbx5EAFkmdJa-yJ47WymAAnqsxTZ2ZhE',
    bucketFotos: 'chales'
  },

  /* ---------------------------------------------------------
     Regras de preço do simulador
     valorHospedeExtraPorNoite: só entra na conta se um chalé tiver
     capacidade acima de hospedesInclusos (hoje nenhum tem).
     --------------------------------------------------------- */
  precos: {
    hospedesInclusos: 2,
    valorHospedeExtraPorNoite: 60,
    minimoNoites: 1,
    maximoNoites: 30,
    minimoHospedes: 1,
    maximoHospedes: 8
  },

  /* Texto obrigatório de transparência */
  avisos: {
    valores: 'A reserva é confirmada e a disponibilidade validada pelo WhatsApp.',
    imagens: 'Imagens meramente ilustrativas, até serem substituídas pelas fotos reais.',
    depoimento: 'Depoimento ilustrativo'
  }
};
