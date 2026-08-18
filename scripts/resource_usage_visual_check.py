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
    "last_synced_at": "2026-08-13T10:30:00-03:00",
    "deletion_requested_at": None,
    "deletes_at": None,
    "can_cancel_deletion": False,
    "created_at": "2026-08-10T16:45:00-03:00",
}

stats = {
    "availability": "available",
    "retryable": False,
    "safe_code": "ok",
    "measured_at": "2026-08-13T10:30:00-03:00",
    "is_stale": False,
    "metrics": {
        "disk": {"used": 1073741824, "limit": 5368709120, "unit": "bytes"},
        "bandwidth": {
            "used": 5368709120,
            "limit": 52428800000,
            "unit": "bytes",
        },
        "inodes": {"used": 76, "limit": 80000, "unit": "count"},
        "domains": {"used": 1, "limit": 2, "unit": "count"},
        "databases": {"used": 1, "limit": 2, "unit": "count"},
    },
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

plans = [
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
        "product": {
            "id": 2,
            "name": "Hospedagem Pro",
            "description": "Mais recursos para sua hospedagem.",
            "features": ["10 GB de disco", "150 GB de tráfego"],
            "recommended": True,
            "free": False,
        },
        "prices": [],
    }
]


def register_routes(page):
    page.route(
        "**/api/v1/hosting/accounts/991001/stats",
        lambda route: route.fulfill(json={"data": stats}),
    )
    page.route(
        "**/api/v1/hosting/accounts/991001/activity",
        lambda route: route.fulfill(json={"data": []}),
    )
    page.route(
        "**/api/v1/hosting/accounts/991001/domains",
        lambda route: route.fulfill(json=domains),
    )
    page.route(
        "**/api/v1/hosting/accounts/991001/tools",
        lambda route: route.fulfill(json={"data": []}),
    )
    page.route(
        "**/api/v1/hosting/accounts",
        lambda route: route.fulfill(json={"data": [account]}),
    )
    page.route(
        "**/api/v1/hosting/plans",
        lambda route: route.fulfill(json={"data": plans}),
    )


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
    register_routes(page)

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill("codex-dashboard-visual@example.test")
    page.locator('input[name="password"]').fill("VisualTest-2026!")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**")
    page.wait_for_load_state("networkidle")
    page.get_by_text("1 GB / 5 GB", exact=True).first.wait_for()
    page.get_by_text("5 GB / 50 GB", exact=True).first.wait_for()
    page.screenshot(path=str(OUTPUT / "resource-usage-home-desktop.png"), full_page=True)
    print(
        f"home_desktop_width={page.evaluate('document.documentElement.scrollWidth')} viewport=1440"
    )

    unavailable_stats = {
        "availability": "unavailable",
        "retryable": True,
        "safe_code": "panel_unreachable",
        "measured_at": None,
        "is_stale": False,
        "metrics": {
            "disk": {"used": None, "limit": 5368709120, "unit": "bytes"},
            "bandwidth": {"used": None, "limit": 52428800000, "unit": "bytes"},
            "inodes": {"used": None, "limit": None, "unit": "count"},
            "domains": {"used": None, "limit": 2, "unit": "count"},
            "databases": {"used": None, "limit": 2, "unit": "count"},
        },
    }
    page.unroute("**/api/v1/hosting/accounts/991001/stats")
    page.route(
        "**/api/v1/hosting/accounts/991001/stats",
        lambda route: route.fulfill(json={"data": unavailable_stats}),
    )
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_text("Limite de 5 GB", exact=True).first.wait_for()
    page.get_by_text("Limites do plano disponíveis", exact=True).wait_for()
    page.screenshot(
        path=str(OUTPUT / "resource-usage-home-fallback-desktop.png"),
        full_page=True,
    )

    page.unroute("**/api/v1/hosting/accounts/991001/stats")
    page.route(
        "**/api/v1/hosting/accounts/991001/stats",
        lambda route: route.fulfill(json={"data": stats}),
    )

    page.goto("http://127.0.0.1:8011/dashboard/hosting/991001")
    page.wait_for_load_state("networkidle")
    page.get_by_text("1 GB / 5 GB", exact=True).first.wait_for()
    page.get_by_text("5 GB / 50 GB", exact=True).first.wait_for()
    page.screenshot(
        path=str(OUTPUT / "resource-usage-hosting-desktop.png"), full_page=True
    )

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_text("1 GB / 5 GB", exact=True).first.wait_for()
    page.screenshot(
        path=str(OUTPUT / "resource-usage-hosting-mobile.png"), full_page=True
    )
    mobile_width = page.evaluate("document.documentElement.scrollWidth")
    print(f"hosting_mobile_width={mobile_width} viewport=375")
    print(f"errors={len(errors)}")
    for error in errors:
        print(error)

    if mobile_width > 375 or errors:
        raise SystemExit(1)

    browser.close()
