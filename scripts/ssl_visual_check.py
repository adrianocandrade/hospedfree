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
    "technical": {"ftp_host": "ftp.preview-dashboard.hsite.top", "sql_host": "sql.preview-dashboard.hsite.top"},
    "tools": {"control_panel": True, "webftp": True, "installer": True, "file_manager": True, "site_builder": True, "ssl": True, "mysql": True, "stats": True},
    "plan": {"id": 1, "type": "free", "name": "Hospedagem Free"},
    "activated_at": "2026-08-10T16:45:00-03:00",
    "last_synced_at": "2026-08-12T10:30:00-03:00",
    "deletion_requested_at": None,
    "deletes_at": None,
    "can_cancel_deletion": False,
    "created_at": "2026-08-10T16:45:00-03:00",
}

certificates = {
    "data": [{
        "id": 991201,
        "hosting_account_id": 991001,
        "domain": "preview-dashboard.hsite.top",
        "status": "issued",
        "installation_status": "manual_required",
        "renewal_status": "action_required",
        "validation_method": "dns-01",
        "dns_validation": None,
        "renewal_dns_validation": {
            "type": "TXT",
            "name": "_acme-challenge.preview-dashboard.hsite.top",
            "value": "renewal-preview-token",
            "ttl": 120,
            "managed": True,
        },
        "safe_message": "Certificado emitido. A instalação automática não é suportada pelo painel desta conta.",
        "requested_at": "2026-08-12T10:30:00-03:00",
        "verified_at": "2026-08-12T10:34:00-03:00",
        "issued_at": "2026-08-12T10:34:00-03:00",
        "installation_attempted_at": "2026-08-12T10:35:00-03:00",
        "installed_at": None,
        "last_checked_at": None,
        "renewal_requested_at": "2026-08-12T10:40:00-03:00",
        "renewal_retry_after": None,
        "last_renewed_at": None,
        "valid_until": "2026-11-10T10:34:00-03:00",
        "revoked_at": None,
        "created_at": "2026-08-12T10:30:00-03:00",
    }],
    "links": {},
    "meta": {},
}

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
    errors = []
    failed_responses = []
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))
    page.on("response", lambda response: failed_responses.append(f"{response.status}:{response.url}") if response.status >= 400 else None)

    page.route("**/api/v1/hosting/accounts/991001/ssl", lambda route: route.fulfill(json=certificates))
    page.route("**/api/v1/hosting/accounts/991001/stats", lambda route: route.fulfill(json={"data": {
        "availability": "available",
        "retryable": False,
        "safe_code": "ok",
        "measured_at": "2026-08-12T10:30:00-03:00",
        "is_stale": False,
        "metrics": {
            "disk": {"used": 1073741824, "limit": 5368709120, "unit": "bytes"},
            "bandwidth": {"used": 5368709120, "limit": 53687091200, "unit": "bytes"},
            "inodes": {"used": 1200, "limit": 10000, "unit": "count"},
            "domains": {"used": 1, "limit": None, "unit": "count"},
            "databases": {"used": 2, "limit": None, "unit": "count"},
        },
    }}))
    page.route("**/api/v1/hosting/accounts", lambda route: route.fulfill(json={"data": [account]}))

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill("codex-dashboard-visual@example.test")
    page.locator('input[name="password"]').fill("VisualTest-2026!")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**")

    page.goto("http://127.0.0.1:8011/dashboard/hosting/991001/ssl")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(OUTPUT / "hosting-ssl-diagnostic.png"), full_page=True)
    print(f"ssl_url={page.url}")
    print(page.locator("body").inner_text()[:1200])
    for error in errors:
        print(error)
    page.get_by_role("heading", name="HTTPS e certificados SSL", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-ssl-desktop.png"), full_page=True)
    page.get_by_text("Revogar certificado", exact=True).click()
    page.get_by_role("heading", name="Revogar certificado", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-ssl-cancel-dialog.png"), full_page=True)
    page.get_by_text("Voltar", exact=True).click()

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="HTTPS e certificados SSL", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-ssl-mobile.png"), full_page=True)

    print(f"desktop_width=1440")
    print(f"mobile_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=375")
    print(f"errors={len(errors)}")
    for error in errors:
        print(error)
    for response in failed_responses:
        print(f"response={response}")

    browser.close()
