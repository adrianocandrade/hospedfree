@extends ('common::prerender.base')

@section ('head')
  @include ('seo.hosting-site-builder.seo-tags')
@endsection

@section ('body')
  <header>
    <a href="/" aria-label="HospedFree — página inicial">
      <img src="/images/logo-1.png" alt="HospedFree" width="176" height="45">
    </a>
    <nav aria-label="Navegação principal">
      <a href="/#recursos">Recursos</a>
      <a href="/#como-funciona">Como funciona</a>
      <a href="/construtor-de-sites" aria-current="page">Criador de sites</a>
      <a href="/planos">Planos</a>
      <a href="/faq">Ajuda</a>
      <a href="/login">Entrar</a>
      <a href="/register">Criar conta grátis</a>
    </nav>
  </header>

  <main>
    <section aria-labelledby="builder-title">
      <p>Construtor de sites HospedFree</p>
      <h1 id="builder-title">Crie visualmente. Publique seu site.</h1>
      <p>Escolha um domínio ativo, abra o editor pelo painel e desenvolva seu site no navegador. A sessão é criada apenas quando você decide entrar.</p>
      <a href="/register">Criar conta grátis</a>
      <a href="#demonstracao">Assistir demonstração</a>
      <ul>
        <li>Acesso pelo painel</li>
        <li>Domínio ativo selecionado</li>
        <li>Credenciais mantidas no servidor</li>
      </ul>
      <img
        src="/images/hospedfree/construtor-hospedfree.png"
        alt="Pessoa usando o construtor visual de sites em um notebook"
        width="1917"
        height="923"
      >
    </section>

    <section aria-labelledby="builder-capabilities">
      <h2 id="builder-capabilities">Um editor ligado à sua hospedagem</h2>
      <ul>
        <li><strong>Domínio ativo.</strong> Escolha onde o projeto será editado.</li>
        <li><strong>Editor visual.</strong> Crie no navegador sem começar pelo código.</li>
        <li><strong>Sessão protegida.</strong> O acesso é preparado somente ao abrir.</li>
        <li><strong>Mesmo painel.</strong> Volte à hospedagem sempre que precisar.</li>
      </ul>
    </section>

    <section id="como-funciona" aria-labelledby="builder-flow">
      <p>Do painel ao editor</p>
      <h2 id="builder-flow">Três passos para começar com clareza.</h2>
      <p>O construtor aparece como parte da sua hospedagem. Você confirma o contexto antes de seguir para o editor.</p>
      <ol>
        <li><strong>Ative sua hospedagem.</strong> A conta precisa estar pronta para que as ferramentas sejam liberadas.</li>
        <li><strong>Escolha o domínio.</strong> Selecione um dos domínios ativos vinculados à sua conta.</li>
        <li><strong>Abra o editor.</strong> O painel cria uma sessão protegida e abre o construtor em uma nova guia.</li>
      </ol>
      <img
        src="/images/sitepro/isometric-scehmemobile-mockup-2.png"
        alt="Exemplos de sites responsivos exibidos em diferentes celulares"
        width="2000"
        height="1500"
        loading="lazy"
      >
    </section>

    <section aria-labelledby="builder-benefits">
      <h2 id="builder-benefits">Por que criar seu site com o construtor da HospedFree?</h2>
      <p>Monte desde uma página simples até uma loja virtual usando o editor visual habilitado para a sua hospedagem.</p>
      <ul>
        <li><strong>Criação sem código.</strong> Desenhe, organize e publique páginas sem precisar lidar diretamente com arquivos ou bancos de dados.</li>
        <li><strong>Mais de 200 modelos.</strong> Comece por uma estrutura pronta e adapte o visual ao seu projeto.</li>
        <li><strong>Design responsivo.</strong> Crie páginas preparadas para computadores, tablets e celulares.</li>
        <li><strong>Liberdade de design.</strong> Personalize seções, conteúdo e aparência no editor visual.</li>
        <li><strong>Loja virtual.</strong> Use os recursos de comércio eletrônico disponíveis na versão habilitada do editor.</li>
        <li><strong>SEO.</strong> Configure recursos de otimização para ajudar seu conteúdo a ser encontrado.</li>
        <li><strong>Sites multilíngues.</strong> Organize conteúdo em mais de um idioma quando o recurso estiver disponível.</li>
        <li><strong>Importação de site.</strong> Aproveite um projeto existente com as ferramentas oferecidas pelo editor.</li>
      </ul>
      <img
        src="/images/sitepro/Tablet-mockup.png"
        alt="Modelos de sites sendo personalizados no editor visual em tablets"
        width="1920"
        height="1080"
        loading="lazy"
      >
      <p><strong>Disponibilidade:</strong> modelos e recursos avançados variam conforme a versão do editor habilitada para sua conta. Upgrades, quando disponíveis, aparecem dentro do próprio editor.</p>
    </section>

    <section id="demonstracao" aria-labelledby="builder-demo">
      <h2 id="builder-demo">Veja o editor em ação</h2>
      <p>Assista à demonstração oficial da tecnologia Site.pro usada pelo construtor para conhecer o fluxo de criação visual.</p>
      <img
        src="/images/sitepro/Marketing-materialsmackbook.png"
        alt="Editor visual de sites exibido em um notebook"
        width="1920"
        height="1080"
        loading="lazy"
      >
      <a
        href="https://www.youtube.com/watch?v=jzbqVK8s6jI"
        target="_blank"
        rel="noopener noreferrer"
      >Assistir à demonstração do Site.pro no YouTube (abre em nova guia)</a>
    </section>

    <section aria-labelledby="builder-security">
      <p>Acesso sob controle</p>
      <h2 id="builder-security">Você vê o projeto. O servidor protege o acesso.</h2>
      <p>O caminho até o editor passa pela conta autenticada e pelo domínio selecionado. Informações técnicas sensíveis permanecem no servidor.</p>
      <ul>
        <li>Somente domínios ativos da própria hospedagem aparecem para seleção.</li>
        <li>Credenciais e tokens permanecem protegidos e não são colocados na página.</li>
        <li>O editor abre em uma nova guia e o painel continua disponível.</li>
      </ul>
    </section>

    <section aria-labelledby="builder-cta">
      <h2 id="builder-cta">Crie grátis. Edite visualmente.</h2>
      <p>Crie sua conta ou abra uma hospedagem existente para escolher o domínio e acessar o construtor.</p>
      <a href="/register">Criar conta grátis</a>
      <a href="/faq">Consultar a central de ajuda</a>
    </section>
  </main>

  <footer>
    <a href="/">HospedFree</a>
    <a href="/planos">Planos</a>
    <a href="/faq">Central de ajuda</a>
    <a href="/pages/terms-of-service">Termos de uso</a>
    <a href="/pages/privacy-policy">Privacidade</a>
  </footer>
@endsection
