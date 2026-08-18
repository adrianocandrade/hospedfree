from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)

account = {
    "id": 991001,
    "uuid": "00000000-0000-4000-8000-000000991001",
    "fqdn": "preview-planos.hsite.top",
    "status": "active",
    "desired_status": None,
    "username_masked": "hf******",
    "has_credentials": True,
    "technical": {"ftp_host": "ftp.preview-planos.hsite.top", "sql_host": "sql.preview-planos.hsite.top"},
    "tools": {"control_panel": True, "webftp": True, "installer": True, "file_manager": True, "site_builder": True, "ssl": True, "mysql": True, "stats": True},
    "plan": {
        "id": 1,
        "product_id": 1,
        "type": "free",
        "name": "Hospedagem Free",
        "quotas": {"disk_mb": 5120, "bandwidth_mb": 50000, "domains": 2, "databases": 2, "ad_free": True},
    },
    "activated_at": "2026-08-10T16:45:00-03:00",
    "last_synced_at": "2026-08-12T10:30:00-03:00",
    "deletion_requested_at": None,
    "deletes_at": None,
    "can_cancel_deletion": False,
    "created_at": "2026-08-10T16:45:00-03:00",
}

plans = [
    {
        "id": 1,
        "type": "free",
        "max_accounts_per_workspace": 1,
        "quotas": {"disk_mb": 5120, "bandwidth_mb": 50000, "domains": 2, "databases": 2, "ad_free": True},
        "purchase_available": True,
        "product": {"id": 1, "name": "Hospedagem Free", "description": "Recursos essenciais para publicar seu primeiro site.", "features": [], "recommended": False, "free": True},
        "prices": [],
    },
    {
        "id": 2,
        "type": "paid",
        "max_accounts_per_workspace": 1,
        "quotas": {"disk_mb": 10240, "bandwidth_mb": 150000, "domains": 5, "databases": 10, "ad_free": True},
        "purchase_available": False,
        "product": {"id": 2, "name": "Hospedagem Pro", "description": "Mais capacidade para projetos que precisam crescer.", "features": [], "recommended": True, "free": False},
        "prices": [],
    },
]

stats = {
    "availability": "available",
    "retryable": False,
    "safe_code": "ok",
    "measured_at": "2026-08-12T10:30:00-03:00",
    "is_stale": False,
    "metrics": {
        "disk": {"used": 3145728, "limit": 5368709120, "unit": "bytes"},
        "bandwidth": {"used": 0, "limit": 52428800000, "unit": "bytes"},
        "inodes": {"used": None, "limit": None, "unit": "count"},
        "domains": {"used": 1, "limit": 2, "unit": "count"},
        "databases": {"used": 1, "limit": 2, "unit": "count"},
    },
}


with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    )
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{message.text}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))
    page.on(
        "response",
        lambda response: errors.append(f"http:{response.status}:{response.url}")
        if response.status >= 400
        else None,
    )
    page.route(
        "**/api/v1/hosting/accounts",
        lambda route: route.fulfill(json={"data": [account]}),
    )
    page.route(
        "**/api/v1/hosting/accounts/991001/stats",
        lambda route: route.fulfill(json={"data": stats}),
    )
    page.route(
        "**/api/v1/hosting/plans",
        lambda route: route.fulfill(json={"data": plans}),
    )

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill("codex-dashboard-visual@example.test")
    page.locator('input[name="password"]').fill("VisualTest-2026!")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**")

    page.goto("http://127.0.0.1:8011/dashboard/hosting/plans")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Mais recursos para seu site").wait_for()
    page.get_by_text("Hospedagem Free", exact=True).first.wait_for()
    page.get_by_text("Hospedagem Pro", exact=True).first.wait_for()
    page.get_by_text("Aguardando preço", exact=True).wait_for()
    assert page.get_by_text("Mensal", exact=True).count() == 0
    assert page.get_by_text("Anual", exact=True).count() == 0
    assert page.evaluate("document.documentElement.scrollWidth") <= 1440
    page.screenshot(path=str(OUTPUT / "hosting-dashboard-plans-desktop.png"), full_page=True)

    page.set_viewport_size({"width": 390, "height": 844})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Mais recursos para seu site").wait_for()
    assert page.evaluate("document.documentElement.scrollWidth") <= 390
    page.screenshot(path=str(OUTPUT / "hosting-dashboard-plans-mobile.png"), full_page=True)

    assert not errors, "\n".join(errors)
    print("hosting dashboard plans visual check passed")
    browser.close()
