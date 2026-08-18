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
    "username_masked": "hs••••••••••••",
    "has_credentials": True,
    "technical": {"ftp_host": "ftpupload.net", "sql_host": None},
    "tools": {
        "control_panel": False,
        "webftp": False,
        "installer": False,
        "file_manager": True,
        "site_builder": True,
        "ssl": True,
        "mysql": False,
        "stats": False,
    },
    "plan": {"id": 1, "type": "free", "name": "Hospedagem Free"},
    "activated_at": "2026-08-13T01:00:00-03:00",
    "last_synced_at": "2026-08-13T01:36:00-03:00",
    "deletion_requested_at": None,
    "deletes_at": None,
    "can_cancel_deletion": False,
    "created_at": "2026-08-10T16:45:00-03:00",
}

domains = {
    "data": [
        {
            "domain": account["fqdn"],
            "type": "primary",
            "status": "active",
            "is_primary": True,
        }
    ],
    "availability": "available",
    "retryable": False,
    "safe_code": "ok",
    "allowed_zones": ["hsite.top"],
    "can_manage_subdomains": True,
    "can_manage_custom_domains": False,
}

stats = {
    "data": {
        "availability": "not_supported",
        "retryable": False,
        "safe_code": "panel_not_configured",
        "measured_at": None,
        "is_stale": False,
        "metrics": None,
    }
}

tools = {
    "data": [
        {"key": "file-manager", "label": "Gerenciador de arquivos", "available": True},
        {"key": "site-builder", "label": "Construtor de site", "available": True},
    ]
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
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
        "**/api/v1/hosting/accounts/991001/domains",
        lambda route: route.fulfill(json=domains),
    )
    page.route(
        "**/api/v1/hosting/accounts/991001/stats",
        lambda route: route.fulfill(json=stats),
    )
    page.route(
        "**/api/v1/hosting/accounts/991001/tools",
        lambda route: route.fulfill(json=tools),
    )
    page.route(
        "**/api/v1/hosting/accounts",
        lambda route: route.fulfill(json={"data": [account]}),
    )

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill("codex-dashboard-visual@example.test")
    page.locator('input[name="password"]').fill("VisualTest-2026!")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**")
    page.context.add_cookies(
        [
            {
                "name": "be-color-scheme",
                "value": "dark",
                "domain": "127.0.0.1",
                "path": "/",
            }
        ]
    )
    page.goto("http://127.0.0.1:8011/dashboard/hosting/991001")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name=account["fqdn"], exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-overview-real-data-desktop.png"), full_page=True)
    print(f"desktop_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=1440")

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name=account["fqdn"], exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-overview-real-data-mobile.png"), full_page=True)
    print(f"mobile_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=375")
    print(f"errors={len(errors)}")
    for error in errors:
        print(error)
    browser.close()
