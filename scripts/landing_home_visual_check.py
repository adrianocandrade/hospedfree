from pathlib import Path
import sys

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)
USE_LIVE_DATA = "--live-data" in sys.argv

PLANS = [
    {
        "id": 1,
        "type": "free",
        "sort_order": 0,
        "max_accounts_per_workspace": 1,
        "quotas": {
            "disk_mb": 5120,
            "bandwidth_mb": 50000,
            "domains": 2,
            "databases": 2,
            "ad_free": True,
        },
        "purchase_available": True,
        "product": {
            "id": 1,
            "name": "Hospedagem Free",
            "description": "Recursos essenciais para publicar seu primeiro site.",
            "features": [],
            "recommended": False,
            "free": True,
        },
        "prices": [],
    },
    {
        "id": 2,
        "type": "paid",
        "sort_order": 1,
        "max_accounts_per_workspace": 1,
        "quotas": {
            "disk_mb": 10240,
            "bandwidth_mb": 150000,
            "domains": 5,
            "databases": 10,
            "ad_free": True,
        },
        "purchase_available": False,
        "product": {
            "id": 2,
            "name": "Hospedagem Pro",
            "description": "Mais capacidade para projetos que precisam crescer.",
            "features": [],
            "recommended": True,
            "free": False,
        },
        "prices": [],
    },
]

ARTICLES = [
    {
        "id": 1,
        "slug": "comecando-com-sua-hospedagem-gratuita",
        "title": "Começando com sua hospedagem gratuita",
        "excerpt": "Entenda o fluxo básico para criar uma conta e publicar.",
        "category": {"id": 1, "name": "Primeiros passos"},
    },
    {
        "id": 2,
        "slug": "como-enviar-arquivos",
        "title": "Como enviar arquivos para o site",
        "excerpt": "Organize seu conteúdo com o gerenciador de arquivos.",
        "category": {"id": 2, "name": "Arquivos e FTP"},
    },
    {
        "id": 3,
        "slug": "como-instalar-wordpress",
        "title": "Como instalar o WordPress",
        "excerpt": "Abra o instalador e acompanhe a publicação.",
        "category": {"id": 3, "name": "Aplicações"},
    },
    {
        "id": 4,
        "slug": "dominio-e-ssl",
        "title": "Domínio e certificado SSL",
        "excerpt": "Confira os estados de validação e proteção.",
        "category": {"id": 4, "name": "Domínios e DNS"},
    },
]


def inspect_page(page, width: int, height: int, filename: str):
    page.set_viewport_size({"width": width, "height": height})
    page.goto("http://127.0.0.1:8011/")
    page.wait_for_load_state("networkidle")

    if page.locator("#hf-home-title").count() == 0:
        debug_path = OUTPUT / f"debug-{filename}"
        page.screenshot(path=str(debug_path), full_page=True)
        print(f"debug url={page.url} title={page.title()}")
        print(page.locator("body").inner_text()[:3000])
        print("browser errors:")
        print("\n".join(errors) if errors else "none")
        print("failed requests:")
        print("\n".join(failed_requests) if failed_requests else "none")
        print(f"debug screenshot={debug_path}")
        raise AssertionError("React landing did not replace the prerendered fallback")

    page.get_by_role("heading", name="Seu site no ar. Você no controle.").wait_for()
    page.get_by_role("heading", name="WordPress em poucos cliques.").wait_for()
    page.get_by_text("Softaculous", exact=True).wait_for()
    page.get_by_text("Hospedagem Free", exact=True).wait_for()
    page.get_by_text("Hospedagem Pro", exact=True).wait_for()
    page.get_by_text("Preço em configuração", exact=True).wait_for()

    assert page.title().count("HospedFree") == 1, page.title()
    assert page.locator(".hf-home-hero input").count() == 0
    assert page.get_by_text("Testemunhos", exact=True).count() == 0
    assert page.locator(".hf-home-control h2").text_content().strip() == (
        "Tudo no mesmo painel."
    )
    assert page.locator(
        'img[src="/images/hospedfree/painel-user-hospedfree.png"]'
    ).count() == 1
    assert page.locator(
        'img[src="/images/hospedfree/desenvolvedor-publicando-site-em-casa.jpg"]'
    ).count() == 1

    menu_button_visible = page.locator(".hf-menu-button").is_visible()
    if width >= 1024:
        assert not menu_button_visible, "mobile menu button is visible on desktop"
    else:
        assert menu_button_visible, "mobile menu button is hidden on mobile/tablet"

    document_width = page.evaluate("document.documentElement.scrollWidth")
    assert document_width <= width, f"horizontal overflow: {document_width}px > {width}px"

    title_metrics = page.locator("#hf-home-title").evaluate(
        """element => {
          const style = getComputedStyle(element);
          return {
            height: element.getBoundingClientRect().height,
            lineHeight: Number.parseFloat(style.lineHeight),
          };
        }"""
    )
    title_lines = title_metrics["height"] / title_metrics["lineHeight"]
    assert title_lines <= 2.2, f"hero title uses {title_lines:.2f} lines"

    display_titles = page.locator(".hf-home-display").evaluate_all(
        """elements => elements.map(element => {
          const style = getComputedStyle(element);
          const lineHeight = Number.parseFloat(style.lineHeight);
          return {
            text: element.textContent.trim(),
            lines: element.getBoundingClientRect().height / lineHeight,
          };
        })"""
    )
    overflowing_titles = [
        title for title in display_titles if title["lines"] > 2.2
    ]
    assert not overflowing_titles, f"section titles exceed two lines: {overflowing_titles}"

    page.evaluate(
        """async () => {
          const pause = duration => new Promise(resolve => setTimeout(resolve, duration));
          const step = Math.max(window.innerHeight * 0.8, 480);

          for (let position = 0; position < document.body.scrollHeight; position += step) {
            window.scrollTo({top: position, behavior: 'instant'});
            await pause(90);
          }

          window.scrollTo({top: 0, behavior: 'instant'});
          await pause(180);
        }"""
    )
    page.wait_for_function(
        "Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)"
    )

    failed_images = page.locator("img").evaluate_all(
        "images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src)"
    )
    assert not failed_images, f"images failed: {failed_images}"

    page.screenshot(path=str(OUTPUT / filename), full_page=True)
    print(
        f"{filename}: document={document_width}px viewport={width}px title_lines={title_lines:.2f}"
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    )
    page = browser.new_page(
        viewport={"width": 1440, "height": 1000},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/140.0.0.0 Safari/537.36"
        ),
    )
    errors = []
    failed_requests = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{message.text}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))
    page.on(
        "requestfailed",
        lambda request: failed_requests.append(
            f"{request.method} {request.url}: {request.failure}"
        )
        if request.url.startswith("http://127.0.0.1:8011")
        else None,
    )
    if not USE_LIVE_DATA:
        page.route(
            "**/api/v1/hosting/plans",
            lambda route: route.fulfill(json={"data": PLANS}),
        )
        page.route(
            "**/api/v1/knowledge/articles*",
            lambda route: route.fulfill(json={"data": ARTICLES}),
        )

    inspect_page(page, 1440, 1000, "landing-home-desktop.png")
    inspect_page(page, 390, 844, "landing-home-mobile.png")

    assert not errors, "\n".join(errors)
    assert not failed_requests, "\n".join(failed_requests)
    print("landing home visual check passed")
    browser.close()
