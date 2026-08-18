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

plans = [{
    "id": 2,
    "type": "paid",
    "max_accounts_per_workspace": 1,
    "quotas": {},
    "product": {"id": 2, "name": "Hospedagem Premium", "description": "Plano de teste visual", "features": ["Mais espaço configurado", "Recursos adicionais do plano"], "recommended": True, "free": False},
    "prices": [{"id": 2, "amount": 19.90, "currency": "BRL", "interval": "month", "interval_count": 1}],
}]

stats = {
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
}

activity = [{
    "id": 1,
    "event": "account.provisioned",
    "from_status": "provisioning",
    "to_status": "active",
    "metadata": {},
    "created_at": "2026-08-12T10:25:00-03:00",
}]

domains = {
    "data": [
        {"domain": "preview-dashboard.hsite.top", "type": "primary", "status": "active", "is_primary": True},
        {"domain": "blog.hsite.top", "type": "subdomain", "status": "active", "is_primary": False},
        {"domain": "cliente-exemplo.com.br", "type": "custom", "status": "pending_verification", "is_primary": False},
    ],
    "availability": "available",
    "retryable": False,
    "safe_code": "ok",
    "allowed_zones": ["hsite.top"],
    "can_manage_subdomains": True,
    "can_manage_custom_domains": False,
}

files = {
    "data": [
        {
            "name": "assets",
            "path": "assets",
            "type": "directory",
            "size": None,
            "modified_at": "2026-08-12T10:25:00-03:00",
            "permissions": None,
        },
        {
            "name": "index.php",
            "path": "index.php",
            "type": "file",
            "size": 1280,
            "modified_at": "2026-08-12T10:25:00-03:00",
            "permissions": None,
        },
        {
            "name": "style.css",
            "path": "style.css",
            "type": "file",
            "size": 760,
            "modified_at": "2026-08-12T10:25:00-03:00",
            "permissions": None,
        },
    ],
    "path": "",
    "availability": "available",
    "retryable": False,
    "safe_code": "ok",
}

databases = {
    "data": [
        {
            "name": "epiz_123456_wordpress",
            "host": "sql.preview-dashboard.hsite.top",
            "username": "epiz_123456",
        },
        {
            "name": "epiz_123456_loja",
            "host": "sql.preview-dashboard.hsite.top",
            "username": "epiz_123456",
        },
    ],
    "availability": "available",
    "retryable": False,
    "safe_code": "ok",
}

ssl_certificates = {
    "data": [{
        "id": 991201,
        "hosting_account_id": 991001,
        "domain": "preview-dashboard.hsite.top",
        "status": "action_required",
        "validation_method": "dns-01",
        "dns_validation": {
            "type": "TXT",
            "name": "_acme-challenge.preview-dashboard.hsite.top",
            "value": "visual-test-dns-validation-token-with-a-long-safe-value",
            "ttl": 120,
            "managed": True,
        },
        "safe_message": "O registro DNS foi configurado automaticamente. Aguarde a propagação e verifique novamente.",
        "requested_at": "2026-08-12T10:30:00-03:00",
        "verified_at": None,
        "issued_at": None,
        "valid_until": None,
        "revoked_at": None,
        "created_at": "2026-08-12T10:30:00-03:00",
    }],
    "links": {},
    "meta": {},
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000}, device_scale_factor=1)
    errors = []
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))

    page.route("**/api/v1/hosting/accounts/991001/stats", lambda route: route.fulfill(json={"data": stats}))
    page.route("**/api/v1/hosting/accounts/991001/activity", lambda route: route.fulfill(json={"data": activity}))
    page.route("**/api/v1/hosting/accounts/991001/domains", lambda route: route.fulfill(json=domains))
    page.route("**/api/v1/hosting/accounts/991001/files*", lambda route: route.fulfill(json=files))
    page.route(
        "**/api/v1/hosting/accounts/991001/files/content*",
        lambda route: route.fulfill(
            json={
                "data": {
                    "path": "index.php",
                    "content": "<?php\n\necho 'HospedFree';\n",
                    "mime_type": "text/x-php",
                    "size": 33,
                }
            }
        ),
    )
    page.route("**/api/v1/hosting/accounts/991001/databases", lambda route: route.fulfill(json=databases))
    page.route("**/api/v1/hosting/accounts/991001/ssl", lambda route: route.fulfill(json=ssl_certificates))
    page.route("**/api/v1/hosting/accounts", lambda route: route.fulfill(json={"data": [account]}))
    page.route("**/api/v1/hosting/plans", lambda route: route.fulfill(json={"data": plans}))

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill("codex-dashboard-visual@example.test")
    page.locator('input[name="password"]').fill("VisualTest-2026!")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**")
    page.wait_for_load_state("networkidle")
    print(f"desktop_url={page.url}")
    print(page.locator("body").inner_text()[:1600])
    page.screenshot(path=str(OUTPUT / "dashboard-diagnostic.png"), full_page=True)
    page.get_by_text("Uso de recursos", exact=True).first.wait_for()
    page.screenshot(path=str(OUTPUT / "dashboard-desktop.png"), full_page=True)

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    for item in page.locator('[data-menu-item-id]').all():
        print(f"mobile_menu={item.inner_text()} box={item.bounding_box()} client={item.evaluate('(el) => el.clientWidth')} scroll={item.evaluate('(el) => el.scrollWidth')}")
    page.screenshot(path=str(OUTPUT / "dashboard-mobile.png"), full_page=True)

    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto("http://127.0.0.1:8011/dashboard/hosting/991001/domains")
    page.wait_for_load_state("networkidle")
    page.get_by_text("Domínios da hospedagem", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-domains-desktop.png"), full_page=True)
    page.get_by_label("Remover subdomínio").click()
    page.get_by_text("Remover subdomínio", exact=True).last.wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-domains-delete-dialog.png"), full_page=True)
    page.get_by_text("Cancelar", exact=True).click()

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_text("Domínios da hospedagem", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-domains-mobile.png"), full_page=True)
    page.get_by_text("Adicionar endereço", exact=True).scroll_into_view_if_needed()
    page.screenshot(path=str(OUTPUT / "hosting-domains-mobile-form.png"))
    print(f"mobile_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=375")

    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto("http://127.0.0.1:8011/dashboard/hosting/991001/files")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Arquivos", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-files-desktop.png"), full_page=True)
    page.get_by_label("Mais ações do item").nth(1).click()
    page.get_by_text("Baixar", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-files-actions-menu.png"), full_page=True)
    page.keyboard.press("Escape")
    page.get_by_text("Novo", exact=True).click()
    page.get_by_text("Criar item", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-files-create-dialog.png"), full_page=True)
    page.get_by_text("Cancelar", exact=True).click()

    page.get_by_text("index.php", exact=True).click()
    page.get_by_label("Conteúdo do arquivo").wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-files-editor.png"), full_page=True)
    page.get_by_text("Cancelar", exact=True).click()

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Arquivos", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-files-mobile.png"), full_page=True)
    print(f"files_mobile_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=375")

    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto("http://127.0.0.1:8011/dashboard/hosting/991001/databases")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Bancos de dados", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-databases-desktop.png"), full_page=True)
    page.get_by_text("Criar banco", exact=True).click()
    page.get_by_text("Criar banco de dados", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-databases-create-dialog.png"), full_page=True)
    page.get_by_text("Cancelar", exact=True).click()

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="Bancos de dados", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-databases-mobile.png"), full_page=True)
    print(f"databases_mobile_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=375")

    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto("http://127.0.0.1:8011/dashboard/hosting/991001/ssl")
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="HTTPS e certificados SSL", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-ssl-desktop.png"), full_page=True)
    page.get_by_text("Cancelar solicitação", exact=True).click()
    page.get_by_role("heading", name="Cancelar solicitação", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-ssl-cancel-dialog.png"), full_page=True)
    page.get_by_text("Voltar", exact=True).click()

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_role("heading", name="HTTPS e certificados SSL", exact=True).wait_for()
    page.screenshot(path=str(OUTPUT / "hosting-ssl-mobile.png"), full_page=True)
    print(f"ssl_mobile_document_width={page.evaluate('document.documentElement.scrollWidth')} viewport=375")

    print(f"url={page.url}")
    print(f"errors={len(errors)}")
    for error in errors:
        print(error)
    browser.close()
