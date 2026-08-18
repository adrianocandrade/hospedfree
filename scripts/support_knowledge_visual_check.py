from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)

created_at = datetime.now(timezone.utc).isoformat()
ticket = {
    "id": 42,
    "uuid": "00000000-0000-4000-8000-000000000042",
    "subject": "Erro ao publicar meu site",
    "type": "bug",
    "department": "technical",
    "status": "open",
    "priority": "normal",
    "hosting_account_id": None,
    "last_message_at": created_at,
    "messages": [
        {
            "id": 1,
            "author_type": "customer",
            "body": "Não consigo publicar meu site e preciso de orientação.",
            "is_internal": False,
            "attachments": [
                {
                    "id": 1,
                    "file_name": "erro.txt",
                    "mime_type": "text/plain",
                    "size": 18,
                    "download_url": "http://127.0.0.1:8011/api/v1/support/tickets/42/attachments/1",
                }
            ],
            "created_at": created_at,
        }
    ],
    "created_at": created_at,
}


def support_handler(route):
    if route.request.method == "POST":
        route.fulfill(status=201, json={"data": ticket})
    else:
        route.fulfill(json={"data": []})


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(
        viewport={"width": 375, "height": 812},
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        extra_http_headers={
            "sec-ch-ua": (
                '"Google Chrome";v="124", "Chromium";v="124", '
                '"Not.A/Brand";v="99"'
            )
        },
    )
    errors = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{message.text}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))

    page.goto("http://127.0.0.1:8011/faq")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Como podemos ajudar?").wait_for()
    faq_width = page.evaluate("document.documentElement.scrollWidth")
    page.screenshot(path=str(OUTPUT / "knowledge-mobile.png"), full_page=True)

    page.get_by_role("link", name="Comecando com sua hospedagem gratuita").click()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Comecando com sua hospedagem gratuita").wait_for()
    article_width = page.evaluate("document.documentElement.scrollWidth")
    page.screenshot(path=str(OUTPUT / "knowledge-article-mobile.png"), full_page=True)

    page.route("**/api/v1/hosting/accounts", lambda route: route.fulfill(json={"data": []}))
    page.route("**/api/v1/support/tickets", support_handler)
    page.route("**/api/v1/support/tickets/42", lambda route: route.fulfill(json={"data": ticket}))

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill("codex-dashboard-visual@example.test")
    page.locator('input[name="password"]').fill("VisualTest-2026!")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**")
    page.goto("http://127.0.0.1:8011/dashboard/support")
    page.wait_for_load_state("networkidle")
    page.get_by_label("Novo chamado").click()
    page.get_by_placeholder("Ex: Não consigo acessar meu painel").fill(ticket["subject"])
    page.locator("#new-ticket-message").fill(ticket["messages"][0]["body"])
    page.locator('input[type="file"]').first.set_input_files(
        {"name": "erro.txt", "mimeType": "text/plain", "buffer": b"erro de publicacao"}
    )
    page.get_by_text("erro.txt", exact=False).wait_for()
    page.get_by_role("button", name="Criar chamado").click()
    page.get_by_role("heading", name=ticket["subject"]).wait_for()
    page.get_by_text(ticket["messages"][0]["body"], exact=True).wait_for()
    support_width = page.evaluate("document.documentElement.scrollWidth")
    page.screenshot(path=str(OUTPUT / "support-mobile-created.png"), full_page=True)

    print(f"faq_mobile_document_width={faq_width} viewport=375")
    print(f"article_mobile_document_width={article_width} viewport=375")
    print(f"support_mobile_document_width={support_width} viewport=375")
    print(f"browser_errors={len(errors)}")
    for error in errors:
        print(error)
    browser.close()

    if faq_width > 375 or article_width > 375 or support_width > 375 or errors:
        raise SystemExit(1)
