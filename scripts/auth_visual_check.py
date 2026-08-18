from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests" / "auth"
OUTPUT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)

    for viewport in (
        {"width": 1440, "height": 960},
        {"width": 1024, "height": 768},
        {"width": 390, "height": 844},
    ):
        page = browser.new_page(
            viewport=viewport,
            service_workers="block",
            color_scheme="dark",
        )
        errors: list[str] = []
        page.on(
            "console",
            lambda message: errors.append(f"console:{message.type}:{message.text}")
            if message.type == "error"
            else None,
        )
        page.on("pageerror", lambda error: errors.append(f"page:{error}"))

        page.goto("http://127.0.0.1:8011/login")
        page.wait_for_load_state("networkidle")
        necessary_only = page.get_by_role("button", name="Somente necessários")
        if necessary_only.is_visible():
            necessary_only.click()
        page.get_by_role("heading", name="Bem-vindo de volta").wait_for()
        page.get_by_label("E-mail").wait_for()
        page.get_by_label("Senha").wait_for()
        page.get_by_role("button", name="Entrar").wait_for()
        page.get_by_role("link", name="Esqueceu sua senha?").wait_for()

        document_width = page.evaluate("document.documentElement.scrollWidth")
        if document_width > viewport["width"]:
            raise AssertionError(
                f"horizontal overflow ({document_width}px > {viewport['width']}px)"
            )

        page.screenshot(
            path=str(OUTPUT / f"login-{viewport['width']}.png"),
            full_page=True,
        )

        if errors:
            raise AssertionError("\n".join(errors))

        print(f"viewport={viewport['width']} errors=0 overflow=0")
        page.close()

    browser.close()
