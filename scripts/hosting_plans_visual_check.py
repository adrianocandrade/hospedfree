from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)

plans = [
    {
        "id": 1,
        "type": "free",
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


def inspect_page(page, width: int, height: int, filename: str):
    page.set_viewport_size({"width": width, "height": height})
    page.goto("http://127.0.0.1:8011/planos")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Comece grátis. Cresça depois.").wait_for()
    page.get_by_text("Hospedagem Free", exact=True).first.wait_for()
    page.get_by_text("Hospedagem Pro", exact=True).first.wait_for()
    page.get_by_text("Preço em configuração", exact=True).wait_for()

    assert page.get_by_text("Mensal", exact=True).count() == 0
    assert page.get_by_text("Anual", exact=True).count() == 0
    assert page.get_by_text("5 GB", exact=True).count() > 0
    assert page.get_by_text("10 GB", exact=True).count() > 0

    document_width = page.evaluate("document.documentElement.scrollWidth")
    assert document_width <= width, f"horizontal overflow: {document_width}px > {width}px"
    page.screenshot(path=str(OUTPUT / filename), full_page=True)
    print(f"{filename}: width={document_width} viewport={width}")


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    )
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    account_requests = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{message.text}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))
    page.on(
        "request",
        lambda request: account_requests.append(request.url)
        if "/api/v1/hosting/accounts" in request.url
        else None,
    )
    page.route(
        "**/api/v1/hosting/plans",
        lambda route: route.fulfill(json={"data": plans}),
    )

    inspect_page(page, 1440, 1000, "hosting-plans-desktop.png")
    inspect_page(page, 390, 844, "hosting-plans-mobile.png")

    assert not account_requests, f"guest requested protected accounts API: {account_requests}"
    assert not errors, "\n".join(errors)
    print("hosting plans visual check passed")
    browser.close()
