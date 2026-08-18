from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests" / "public-content"
OUTPUT.mkdir(parents=True, exist_ok=True)

PAGES = {
    "contact": "/contact",
    "blog": "/blog",
    "faq": "/faq",
    "faq-article": "/faq/comecando-com-sua-hospedagem-gratuita",
    "privacy": "/pages/privacy-policy",
    "terms": "/pages/terms-of-service",
    "cookies": "/pages/cookies",
}


def check_page(page, name: str, path: str, viewport_width: int) -> None:
    page.goto(f"http://127.0.0.1:8011{path}")
    page.wait_for_load_state("networkidle")
    page.locator("header.hf-header").wait_for()
    page.locator("footer.hf-footer").wait_for()

    if name == "contact":
        page.get_by_role("heading", name="Como podemos ajudar?").wait_for()
        page.get_by_label("Nome").wait_for()
        page.get_by_label("E-mail").wait_for()
        page.get_by_label("Mensagem").wait_for()
        page.get_by_role("button", name="Enviar mensagem").wait_for()

    document_width = page.evaluate("document.documentElement.scrollWidth")
    if document_width > viewport_width:
        raise AssertionError(
            f"{name}: horizontal overflow ({document_width}px > {viewport_width}px)"
        )

    page.screenshot(
        path=str(OUTPUT / f"{name}-{viewport_width}.png"),
        full_page=True,
    )


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    for viewport in ({"width": 1440, "height": 1000}, {"width": 390, "height": 844}):
        context = browser.new_context(
            viewport=viewport,
            service_workers="block",
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/127.0.0.0 Safari/537.36"
            ),
            extra_http_headers={
                "sec-ch-ua": (
                    '"Not/A)Brand";v="8", "Chromium";v="127", '
                    '"Google Chrome";v="127"'
                )
            },
        )
        page = context.new_page()
        errors: list[str] = []
        page.on(
            "console",
            lambda message: errors.append(f"console:{message.type}:{message.text}")
            if message.type == "error"
            else None,
        )
        page.on("pageerror", lambda error: errors.append(f"page:{error}"))

        page.goto("http://127.0.0.1:8011/contact")
        page.wait_for_load_state("networkidle")
        necessary_only = page.get_by_role("button", name="Somente necessários")
        if necessary_only.is_visible():
            necessary_only.click()

        for name, path in PAGES.items():
            check_page(page, name, path, viewport["width"])

        page.goto("http://127.0.0.1:8011/pages/cookies")
        page.wait_for_load_state("networkidle")
        page.get_by_role("button", name="Gerenciar preferências").click()
        page.get_by_role("dialog").wait_for()
        page.get_by_role("heading", name="Preferências de cookies").wait_for()
        page.screenshot(
            path=str(OUTPUT / f"cookie-preferences-{viewport['width']}.png"),
            full_page=True,
        )

        if errors:
            raise AssertionError("\n".join(errors))

        print(f"viewport={viewport['width']} pages={len(PAGES)} errors=0 overflow=0")
        context.close()

    browser.close()
