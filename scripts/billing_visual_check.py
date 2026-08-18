from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)

account = {
    "id": 991001,
    "uuid": "00000000-0000-4000-8000-000000991001",
    "fqdn": "preview-dashboard.hsite.top",
    "status": "active",
    "desired_status": None,
    "username_masked": "hf••••••",
    "has_credentials": True,
    "technical": {
        "ftp_host": "ftp.preview-dashboard.hsite.top",
        "sql_host": "sql.preview-dashboard.hsite.top",
    },
    "tools": {
        "control_panel": True,
        "webftp": True,
        "installer": True,
        "file_manager": True,
        "site_builder": True,
        "ssl": True,
        "mysql": True,
        "stats": True,
    },
    "plan": {
        "id": 1,
        "product_id": 1,
        "type": "free",
        "name": "Hospedagem Free",
        "quotas": {
            "disk_mb": 5120,
            "bandwidth_mb": 50000,
            "domains": 2,
            "databases": 2,
            "ad_free": True,
        },
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
        "quotas": account["plan"]["quotas"],
        "product": {
            "id": 1,
            "name": "Hospedagem Free",
            "description": "Hospedagem gratuita para começar.",
            "features": [],
            "recommended": False,
            "free": True,
        },
        "prices": [],
    }
]

stats = {
    "availability": "available",
    "retryable": False,
    "safe_code": "ok",
    "measured_at": "2026-08-12T10:30:00-03:00",
    "is_stale": False,
    "metrics": {
        "disk": {"used": 1073741824, "limit": 5368709120, "unit": "bytes"},
        "bandwidth": {
            "used": 5368709120,
            "limit": 53687091200,
            "unit": "bytes",
        },
        "inodes": {"used": 1200, "limit": 10000, "unit": "count"},
        "domains": {"used": 1, "limit": 2, "unit": "count"},
        "databases": {"used": 1, "limit": 2, "unit": "count"},
    },
}

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{message.text}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))

    page.route(
        "**/api/v1/hosting/accounts/991001/stats",
        lambda route: route.fulfill(json={"data": stats}),
    )
    page.route(
        "**/api/v1/hosting/accounts",
        lambda route: route.fulfill(json={"data": [account]}),
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

    page.goto("http://127.0.0.1:8011/account-settings/billing")
    page.wait_for_load_state("networkidle")
    page.get_by_text("Plano, cobranças e faturas", exact=True).wait_for()
    text = page.locator("body").inner_text()
    forbidden = [
        "Conexões",
        "QR codes",
        "Link na bio",
        "Eventos rastreados",
        "Overlays de link",
        "Pastas",
        "CURRENT PLAN",
        "PAYMENT METHOD",
        "INVOICES",
    ]
    found = [label for label in forbidden if label in text]
    print(f"forbidden_labels={found}")
    print(f"desktop_document_width={page.evaluate('document.documentElement.scrollWidth')}")
    page.screenshot(path=str(OUTPUT / "billing-desktop.png"), full_page=True)

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_text("Plano, cobranças e faturas", exact=True).wait_for()
    print(
        f"mobile_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=375"
    )
    page.screenshot(path=str(OUTPUT / "billing-mobile.png"), full_page=True)

    print(f"runtime_errors={errors}")
    browser.close()
