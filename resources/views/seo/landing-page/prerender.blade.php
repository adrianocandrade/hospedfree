@extends ('common::prerender.base')

@section ('head')
  @include ('seo.landing-page.seo-tags')
@endsection

@section ('body')
  <header>
    <a href="/" aria-label="HospedFree — página inicial">
      <img src="/images/logo-1.png" alt="HospedFree" width="176" height="45">
    </a>
    <nav aria-label="Navegação principal">
      <a href="#recursos">Recursos</a>
      <a href="#criador">Criador de sites</a>
      <a href="#instalador">Instalador</a>
      <a href="#planos">Planos</a>
      <a href="#ajuda">Ajuda</a>
      <a href="/login">Entrar</a>
      <a href="/register">Criar conta grátis</a>
    </nav>
  </header>

  <main>
    <section aria-labelledby="titulo-principal">
      <p>Hospedagem para começar e crescer</p>
      <h1 id="titulo-principal">Seu site no ar. Você no controle.</h1>
      <p>Publique arquivos, conecte domínios, crie bancos e abra as ferramentas da sua hospedagem em um painel claro — começando pelo plano gratuito.</p>
      <a href="/register">Criar conta grátis</a>
      <a href="#recursos">Conhecer o painel</a>
      <ul aria-label="Condições para começar">
        <li>Sem cartão para começar</li>
        <li>Subdomínio hsite.top</li>
        <li>Upgrade no mesmo painel</li>
      </ul>
      <img
        src="/images/hospedfree/hero-hospedfree.png"
        alt="Pessoa usando o painel HospedFree para acompanhar uma hospedagem"
        width="1766"
        height="1157"
      >
    </section>

    <section aria-labelledby="capacidades">
      <h2 id="capacidades">O essencial para publicar e manter seu site</h2>
      <ul>
        <li>Painel de hospedagem</li>
        <li>WebFTP e arquivos</li>
        <li>Bancos MySQL</li>
        <li>Criador de sites</li>
        <li>Instalador de aplicações</li>
      </ul>
    </section>

    <section id="recursos" aria-labelledby="titulo-recursos">
      <p>Um painel, todas as etapas</p>
      <h2 id="titulo-recursos">Do domínio aos arquivos. Tudo no mesmo painel.</h2>
      <p>A HospedFree organiza as tarefas na ordem em que você precisa delas. A operação técnica continua protegida; o painel mostra apenas o que ajuda a publicar e manter o site.</p>
      <img
        src="/images/hospedfree-dashboard.png"
        alt="Dashboard HospedFree com uso de recursos, domínio, hospedagem e ações rápidas"
        width="1536"
        height="1024"
        loading="lazy"
      >

      <div>
        <article>
          <h3>Hospedagem</h3>
          <p>Veja o estado da conta e a próxima ação sem adivinhar.</p>
        </article>
        <article>
          <h3>Arquivos</h3>
          <p>Envie e organize conteúdo pelo navegador.</p>
        </article>
        <article>
          <h3>Domínios e SSL</h3>
          <p>Acompanhe DNS, validação e certificado no mesmo fluxo.</p>
        </article>
        <article>
          <h3>Bancos MySQL</h3>
          <p>Consulte limites e crie bancos para suas aplicações.</p>
        </article>
      </div>

      <article>
        <h3>WebFTP sem expor sua senha</h3>
        <p>Crie, envie, edite e organize os arquivos dentro da hospedagem autorizada.</p>
      </article>
      <article>
        <h3>Endereços sob controle</h3>
        <p>Comece com hsite.top ou acompanhe a configuração do seu domínio próprio, incluindo a próxima ação de DNS e o estado do certificado HTTPS.</p>
      </article>
    </section>

    <section id="criador" aria-labelledby="titulo-criador">
      <img
        src="/images/hospedfree/construtor-hospedfree.png"
        alt="Criador de sites visual aberto em notebook e celular"
        width="1917"
        height="923"
        loading="lazy"
      >
      <p>Criador de sites</p>
      <h2 id="titulo-criador">Crie visualmente. Publique no seu domínio.</h2>
      <p>Escolha o domínio da hospedagem, abra o editor por uma sessão autorizada e publique sem precisar montar a página do zero.</p>
      <ul>
        <li>Abertura segura pelo painel</li>
        <li>Edição visual responsiva</li>
        <li>Publicação no domínio selecionado</li>
      </ul>
      <a href="/register">Criar meu site</a>
    </section>

    <section id="instalador" aria-labelledby="titulo-instalador">
      <p>Instalador de aplicações</p>
      <h2 id="titulo-instalador">WordPress pronto para começar.</h2>
      <p>Abra o instalador autorizado pelo painel, escolha a aplicação e continue no catálogo disponível para sua hospedagem.</p>
      <ol>
        <li><strong>Escolha o domínio.</strong></li>
        <li><strong>Abra o instalador.</strong></li>
        <li><strong>Acompanhe pelo painel.</strong></li>
      </ol>
      <h3>Catálogo de aplicações no Softaculous</h3>
      <ul>
        <li>WordPress</li>
        <li>Joomla</li>
        <li>PrestaShop</li>
        <li>phpBB</li>
      </ul>
      <a href="/register">Criar minha hospedagem</a>
    </section>

    <section id="como-funciona" aria-labelledby="titulo-fluxo">
      <p>Da conta ao site publicado</p>
      <h2 id="titulo-fluxo">Três passos claros. Nenhum salto escondido.</h2>
      <ol>
        <li><strong>Crie sua conta.</strong> Cadastre-se e escolha o endereço gratuito para começar.</li>
        <li><strong>Prepare o projeto.</strong> Use arquivos, criador visual ou instalador de aplicações.</li>
        <li><strong>Publique e acompanhe.</strong> Consulte o estado, os limites e as ferramentas no painel.</li>
      </ol>
    </section>

    <section id="planos" aria-labelledby="titulo-planos">
      <p>Planos de hospedagem</p>
      <h2 id="titulo-planos">Comece grátis. Cresça quando precisar.</h2>
      <p>Limites, preço e contratação seguem o catálogo vigente. Uma opção paga só pode ser contratada quando sua configuração comercial estiver completa.</p>

      <article>
        <p>Para começar</p>
        <h3>Hospedagem Free</h3>
        <p><strong>R$ 0,00</strong> para começar.</p>
        <p>Hospedagem gratuita para publicar o primeiro projeto e conhecer o painel.</p>
        <a href="/register">Começar grátis</a>
      </article>

      <article>
        <p>Para crescer</p>
        <h3>Hospedagem Pro</h3>
        <p><strong>Preço em configuração.</strong> O plano pode ser comparado, mas a contratação permanece indisponível enquanto não houver preço e gateway habilitados.</p>
        <p>Mais recursos para projetos que precisam ampliar espaço, tráfego, domínios e bancos.</p>
        <a href="/planos">Comparar detalhes</a>
      </article>
    </section>

    <section id="ajuda" aria-labelledby="titulo-ajuda">
      <p>Central de ajuda</p>
      <h2 id="titulo-ajuda">Respostas para continuar publicando.</h2>
      <p>Cada assunto abre em uma página própria, com endereço compartilhável e conteúdo preparado para você retomar quando precisar.</p>
      <a href="/faq">Abrir central de ajuda</a>
    </section>

    <section aria-labelledby="titulo-cta-final">
      <p>Comece pelo essencial</p>
      <h2 id="titulo-cta-final">Seu próximo site pode começar hoje.</h2>
      <p>Crie a conta gratuita, publique no seu ritmo e aumente os recursos no mesmo painel quando o projeto pedir.</p>
      <a href="/register">Criar conta grátis</a>
      <a href="/planos">Ver planos</a>
      <img
        src="/images/hospedfree/sucesso-hospedfree.png"
        alt="Pessoa celebrando a publicação de um projeto online"
        width="1025"
        height="769"
        loading="lazy"
      >
    </section>
  </main>

  <footer>
    <a href="/" aria-label="HospedFree — página inicial">
      <img src="/images/logo-1.png" alt="HospedFree" width="176" height="45">
    </a>
    <p>Hospedagem para começar gratuitamente, publicar com clareza e crescer quando seu projeto pedir mais.</p>
    <nav aria-label="Navegação do rodapé">
      <a href="#recursos">Recursos</a>
      <a href="#planos">Planos</a>
      <a href="/faq">Central de ajuda</a>
      <a href="/login">Entrar no painel</a>
    </nav>
  </footer>
@endsection
