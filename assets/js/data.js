/* =============================================================
   Chalés de Alfredo — dados mockados
   Para adicionar um chalé, basta copiar um objeto do array
   CHALES e ajustar os campos. Nada mais precisa mudar.
   ============================================================= */

window.DATA = {
  /* ---------------------------------------------------------
     Chalés
     foto: { id, alt } para placeholder do Unsplash, { src, alt } para
     foto local real em assets/img/chales/..., ou null enquanto não
     há foto (mostra um espaço reservado no card).
     avaliacao/avaliacoes: omitir enquanto não houver avaliações reais
     — o card mostra "Novo na pousada" no lugar das estrelas.
     comodidades: chave de ícone (ver ICONES em main.js) + rótulo
     --------------------------------------------------------- */
  chales: [
    {
      id: 'ilha-grega',
      nome: 'Chalé Ilha Grega',
      resumo:
        'Piscina de borda infinita em pedra natural com vista para as montanhas e "cachoeira" aquecida no lugar do chuveiro — feito para casais.',
      capacidade: 2,
      camas: '1 cama queen',
      precoNoite: 1000,
      romantico: true,
      /* Fotos reais, hospedadas no Storage do Supabase (bucket "chales").
         O card mostra um carrossel: passa sozinho a cada 1s, com botões
         de voltar/avançar que pausam o avanço automático. */
      fotos: (function () {
        var base = 'https://dhfnoqdjedcjvzuquzva.supabase.co/storage/v1/object/public/chales/ilha-grega/';
        return [
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.23.20.jpeg', alt: 'Corredor coberto com piscina dos dois lados da passarela de madeira, pétalas de rosa no caminho e teto decorado, terminando numa varanda com vista para as montanhas.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.23.27.jpeg', alt: 'Alcova com vista para a piscina e as montanhas, com chaise estofada branca, velas e almofadas.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.23.38.jpeg', alt: 'Quarto do chalé com cama de dossel, pétalas e buquê de rosas, balão em formato de coração e parede em textura de pedra clara.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.23.49.jpeg', alt: 'Sala de estar com paredes em textura branca, sofás claros, TV e vista para o vale coberto de neblina através do vidro.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.24.00.jpeg', alt: 'Cozinha compacta com armários azuis e mesa pequena posta com taças e uma garrafa de vinho.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.24.10.jpeg', alt: 'Corredor entre duas piscinas levando a uma abertura em arco com vista para as montanhas, pétalas de rosa no caminho de madeira e vasos de plantas.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.24.32.jpeg', alt: 'Cesta com frutas, pão, bebidas e taças apoiada na borda da piscina ao nascer do sol.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.24.40.jpeg', alt: 'Banheira de hidromassagem com paredes de vidro, cactos, pétalas de rosa no caminho e balões em formato de coração.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.24.55.jpeg', alt: 'Outro ângulo da sala de estar, com arco em textura de pedra, plantas penduradas e sofás com almofadas de conchas.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.25.07.jpeg', alt: 'Detalhe da parede em textura de pedra clara com planta pendurada e nicho iluminado.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.25.18.jpeg', alt: 'Mais um ambiente do Chalé Ilha Grega.' }
        ].map(function (f) { return { src: base + encodeURIComponent(f.arquivo), alt: f.alt }; });
      })(),
      comodidades: [
        { icone: 'piscina', nome: 'Piscina aquecida com vista para a serra' },
        { icone: 'banheira', nome: '"Cachoeira" aquecida no banho' },
        { icone: 'lareira', nome: 'Lareira a lenha (sem custo)' },
        { icone: 'cafe', nome: 'Café da manhã + espumante' }
      ]
    },
    {
      id: 'montana',
      nome: 'Chalé Montana',
      resumo:
        'Piscina de água de nascente aquecida dentro do chalé, com tratamento natural e borda infinita voltada para as montanhas.',
      capacidade: 2,
      camas: '1 cama queen',
      precoNoite: 900,
      romantico: true,
      fotos: (function () {
        var base = 'https://dhfnoqdjedcjvzuquzva.supabase.co/storage/v1/object/public/chales/montana/';
        return [
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.26.42.jpeg', alt: 'Casal na piscina de borda infinita do chalé, com vista para o vale verde e as montanhas ao fundo.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.26.48.jpeg', alt: 'Deck de madeira do chalé ao entardecer, com arco-íris duplo sobre o vale.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.26.55.jpeg', alt: 'Sala de estar com lareira, poltronas e uma cesta de café da manhã sobre a mesa.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.27.02.jpeg', alt: 'Vista de dentro da cama em direção ao teto em formato de A, com a piscina visível através do vidro.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.27.14.jpeg', alt: 'Cachoeira aquecida com iluminação verde, no lugar do chuveiro do chalé.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.27.22.jpeg', alt: 'Vista do pôr do sol através da parede de vidro, com a lareira acesa e pétalas de rosa na piscina.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.27.32.jpeg', alt: 'Lareira acesa em primeiro plano, com banco de madeira no deck e céu do pôr do sol ao fundo.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.27.44.jpeg', alt: 'Cozinha com geladeira e churrasqueira embutida, com cama decorada com corações e rosas ao fundo.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.27.54.jpeg', alt: 'Mais um ambiente do Chalé Montana.' },
          { arquivo: 'WhatsApp Image 2026-08-24 at 23.28.05.jpeg', alt: 'Mais um ambiente do Chalé Montana.' }
        ].map(function (f) { return { src: base + encodeURIComponent(f.arquivo), alt: f.alt }; });
      })(),
      comodidades: [
        { icone: 'piscina', nome: 'Piscina de nascente aquecida' },
        { icone: 'banheira', nome: '"Cachoeira" aquecida no banho' },
        { icone: 'lareira', nome: 'Lareira a lenha (sem custo)' },
        { icone: 'cafe', nome: 'Café da manhã + espumante' }
      ]
    }
  ],

  /* ---------------------------------------------------------
     Reservas confirmadas (datas realmente ocupadas)
     Todas as datas começam livres. Para bloquear um período depois que
     uma reserva for confirmada pelo WhatsApp, adicione um objeto
     { inicio: 'AAAA-MM-DD', fim: 'AAAA-MM-DD' } na lista do chalé
     (inicio = check-in, fim = check-out — o dia do check-out em si fica
     livre para o próximo hóspede). Exemplo:
       'ilha-grega': [{ inicio: '2026-09-10', fim: '2026-09-12' }]
     --------------------------------------------------------- */
  reservas: {
    'ilha-grega': [],
    'montana': []
  },

  /* ---------------------------------------------------------
     Experiências / comodidades da pousada
     --------------------------------------------------------- */
  experiencias: [
    {
      icone: 'lareira',
      titulo: 'Lareira a lenha',
      texto: 'Em cada chalé, sem cobrança de lenha à parte.'
    },
    {
      icone: 'piscina',
      titulo: 'Piscina aquecida privativa',
      texto: 'Borda infinita em pedra natural, com vista para a serra, dentro do próprio chalé.'
    },
    {
      icone: 'banheira',
      titulo: '"Cachoeira" no banho',
      texto: 'O chuveiro vira uma cachoeira aquecida, com paredão de pedra e vegetação.'
    },
    {
      icone: 'cafe',
      titulo: 'Café da manhã + espumante',
      texto: 'Café da manhã completo e uma garrafa de espumante ou vinho incluídos na diária.'
    },
    {
      icone: 'cozinha',
      titulo: 'Cozinha completa',
      texto: 'Geladeira com freezer, churrasqueira a carvão e utensílios para todas as refeições.'
    },
    {
      icone: 'pet',
      titulo: 'Pet é bem-vindo',
      texto: 'Os dois chalés são pet friendly — é só avisar na reserva.'
    }
  ],

  /* ---------------------------------------------------------
     Prova social — números ilustrativos
     --------------------------------------------------------- */
  numeros: [
    { valor: '12', rotulo: 'anos recebendo hóspedes' },
    { valor: '4,8', rotulo: 'média de avaliação' },
    { valor: '580', rotulo: 'hóspedes por ano' },
    { valor: '2', rotulo: 'chalés românticos' }
  ],

  /* Depoimentos — SEMPRE exibidos com o rótulo "Depoimento ilustrativo" */
  depoimentos: [
    {
      texto:
        'Chegamos e a piscina já estava quentinha com a serra inteira na frente. O café da manhã com espumante foi o toque a mais que não esperávamos.',
      autor: 'Casal em fim de semana',
      contexto: 'Chalé Ilha Grega · 1 noite'
    },
    {
      texto:
        'Fiz o pedido de namoro na piscina com vista pro vale. Foi surreal — combinamos tudo pelo WhatsApp antes e chegou exatamente como planejado.',
      autor: 'Pedido de namoro',
      contexto: 'Chalé Montana · 1 noite'
    },
    {
      texto:
        'O banho de "cachoeira" aquecida é outro nível, ainda mais com a lareira acesa depois. Voltamos com certeza no próximo aniversário.',
      autor: 'Aniversário de casamento',
      contexto: 'Chalé Ilha Grega · 1 noite'
    }
  ],

  /* Perguntas rápidas usadas na seção de contato */
  faq: [
    {
      pergunta: 'Como confirmo a reserva?',
      resposta:
        'A simulação do site monta a mensagem e leva você ao WhatsApp. A confirmação, as condições e o pagamento são tratados por lá, com uma pessoa de verdade.'
    },
    {
      pergunta: 'Os valores do site são finais?',
      resposta:
        'Sim, é o valor da diária de cada chalé. Qualquer condição especial (datas específicas, pacotes maiores) é confirmada direto no WhatsApp.'
    },
    {
      pergunta: 'Posso levar meu pet?',
      resposta:
        'Sim, os dois chalés são pet friendly. Avise no momento da reserva para nos organizarmos.'
    }
  ]
};
