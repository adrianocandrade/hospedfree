from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)

account = {
    "id": 991001,
    "uuid": "00000000-0000-4000-8000-000000991001",
    "fqdn": "preview-admin.hsite.top",
    "status": "active",
    "desired_status": None,
    "username_masked": "hf••••••",
    "has_credentials": True,
    "technical": {
        "ftp_host": "ftp.preview-admin.hsite.top",
        "sql_host": "sql.preview-admin.hsite.top",
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
    "plan": {"id": 1, "type": "free", "name": "Hospedagem Free"},
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
        "quotas": {},
        "is_active": True,
        "sort_order": 0,
        "provider_packages": [
            {
                "id": 1,
                "provider": "fake",
                "remote_package": "free",
                "is_active": True,
            }
        ],
        "product": {
            "id": 1,
            "name": "Hospedagem Free",
            "description": None,
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
        "quotas": {},
        "is_active": True,
        "sort_order": 1,
        "provider_packages": [
            {
                "id": 2,
                "provider": "fake",
                "remote_package": "premium",
                "is_active": True,
            }
        ],
        "product": {
            "id": 2,
            "name": "Hospedagem Premium",
            "description": None,
            "features": [],
            "recommended": True,
            "free": False,
        },
        "prices": [],
    },
]


def resources_payload(path=""):
    files = (
        [
            {
                "name": "index.php",
                "path": "public/index.php",
                "type": "file",
                "size": 1280,
                "modified_at": "2026-08-12T10:25:00-03:00",
                "permissions": "0644",
            }
        ]
        if path == "public"
        else [
            {
                "name": "public",
                "path": "public",
                "type": "directory",
                "size": None,
                "modified_at": "2026-08-12T10:25:00-03:00",
                "permissions": "0755",
            },
            {
                "name": "readme.txt",
                "path": "readme.txt",
                "type": "file",
                "size": 760,
                "modified_at": "2026-08-12T10:25:00-03:00",
                "permissions": "0644",
            },
        ]
    )
    return {
        "data": {
            "account": account,
            "customer": {
                "id": 17,
                "display_name": "Cliente de teste",
                "email": "cliente@example.test",
            },
            "domains": {
                "data": [
                    {
                        "domain": account["fqdn"],
                        "type": "primary",
                        "status": "active",
                        "is_primary": True,
                    },
                    {
                        "domain": "cliente-exemplo.com.br",
                        "type": "custom",
                        "status": "pending",
                        "is_primary": False,
                    },
                ],
                "availability": "available",
                "retryable": False,
                "safe_code": "ok",
            },
            "files": {
                "data": files,
                "path": path,
                "availability": "available",
                "retryable": False,
                "safe_code": "ok",
            },
            "databases": {
                "data": [
                    {
                        "name": "epiz_123456_site",
                        "host": "sql.preview-admin.hsite.top",
                        "username": "epiz_123456",
                    }
                ],
                "availability": "available",
                "retryable": False,
                "safe_code": "ok",
            },
            "ssl": [
                {
                    "id": 1,
                    "hosting_account_id": 991001,
                    "domain": account["fqdn"],
                    "status": "issued",
                    "installation_status": "installed",
                    "renewal_status": None,
                    "validation_method": "dns-01",
                    "dns_validation": None,
                    "renewal_dns_validation": None,
                    "safe_message": "Certificado instalado.",
                    "requested_at": "2026-08-10T16:45:00-03:00",
                    "verified_at": "2026-08-10T16:50:00-03:00",
                    "issued_at": "2026-08-10T16:55:00-03:00",
                    "installation_attempted_at": "2026-08-10T16:56:00-03:00",
                    "installed_at": "2026-08-10T16:57:00-03:00",
                    "last_checked_at": "2026-08-12T10:30:00-03:00",
                    "renewal_requested_at": None,
                    "renewal_retry_after": None,
                    "last_renewed_at": None,
                    "valid_until": "2026-11-08T16:55:00-03:00",
                    "revoked_at": None,
                    "created_at": "2026-08-10T16:45:00-03:00",
                }
            ],
            "events": [
                {
                    "id": 1,
                    "event": "status_changed",
                    "safe_message": "Hosting account activated.",
                    "from_status": "provisioning",
                    "to_status": "active",
                    "created_at": "2026-08-10T16:45:00-03:00",
                }
            ],
        }
    }


def resources_handler(route):
    query = parse_qs(urlparse(route.request.url).query)
    path = query.get("path", [""])[0]
    route.fulfill(json=resources_payload(path))


def delete_file_handler(route):
    deleted_paths.append(route.request.post_data_json["path"])
    route.fulfill(json={"deleted": True})


def revoke_ssl_handler(route):
    revoked_certificates.append(1)
    route.fulfill(json={"message": "Certificado SSL revogado."})


def account_operation_handler(route):
    requested_operations.append(route.request.post_data_json)
    route.fulfill(status=202, json={"message": "Hosting operation queued."})


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    deleted_paths = []
    revoked_certificates = []
    requested_operations = []
    page.on(
        "console",
        lambda message: errors.append(f"console:{message.type}:{message.text}")
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: errors.append(f"page:{error}"))

    page.route(
        "**/api/v1/admin/hosting/accounts/991001/resources*", resources_handler
    )
    page.route(
        "**/api/v1/admin/hosting/accounts/991001/files*",
        delete_file_handler,
    )
    page.route(
        "**/api/v1/admin/hosting/accounts/991001/ssl/1*",
        revoke_ssl_handler,
    )
    page.route(
        "**/api/v1/admin/hosting/accounts",
        lambda route: route.fulfill(json={"data": [account]}),
    )
    page.route(
        "**/api/v1/admin/hosting/operations",
        lambda route: route.fulfill(json={"data": []}),
    )
    page.route(
        "**/api/v1/admin/hosting/plans",
        lambda route: route.fulfill(json={"data": plans}),
    )
    page.route(
        "**/api/v1/admin/hosting/accounts/991001/operations",
        account_operation_handler,
    )

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    if page.locator('input[name="email"]').count() == 0:
        print(f"login_url={page.url}")
        print(f"login_title={page.title()}")
        print(f"login_body={page.locator('body').inner_text()[:500]}")
        for error in errors:
            print(error)
        browser.close()
        raise SystemExit(1)
    page.locator('input[name="email"]').fill(
        "codex-admin-hosting-visual@example.test"
    )
    page.locator('input[name="password"]').fill("VisualTest-2026!")
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/dashboard**")
    page.goto("http://127.0.0.1:8011/admin/hosting")
    page.wait_for_load_state("networkidle")
    page.get_by_text(account["fqdn"], exact=True).click()
    page.get_by_text("Diagnóstico e ações administrativas por recurso.").wait_for()
    page.screenshot(path=str(OUTPUT / "admin-hosting-resources-desktop.png"))

    page.get_by_role("tab", name="Arquivos").click()
    page.get_by_role("button", name="public").click()
    try:
        page.get_by_text("index.php", exact=True).wait_for(timeout=5000)
    except Exception:
        print(page.locator('[data-slot="dialog-content"]').inner_text()[:1500])
        for error in errors:
            print(error)
        raise
    page.get_by_role("button", name="Remover item da hospedagem").click()
    page.get_by_role("button", name="Remover permanentemente").click()
    page.wait_for_timeout(1000)
    if not deleted_paths:
        print(f"delete_action_disabled={page.get_by_role('button', name='Remover permanentemente').is_disabled()}")
        print(f"alert_dialog={page.get_by_role('alertdialog').inner_text()}")
        for error in errors:
            print(error)
        raise AssertionError("The admin file delete request was not sent.")
    assert deleted_paths == ["public/index.php"]
    page.get_by_role("tab", name="Bancos de dados").click()
    page.get_by_text("epiz_123456_site", exact=True).wait_for()
    page.get_by_role("tab", name="SSL").click()
    page.get_by_text("Instalado", exact=True).wait_for()
    page.get_by_role("button", name="Revogar certificado SSL").click()
    page.get_by_role("button", name="Revogar certificado").click()
    page.wait_for_timeout(1000)
    page.get_by_role("alertdialog").wait_for(state="hidden")
    assert revoked_certificates == [1]

    page.keyboard.press("Escape")
    page.locator('[data-slot="dialog-content"]').wait_for(state="hidden")

    page.get_by_role("button", name="Ações da hospedagem").click()
    page.get_by_text("Redefinir senha", exact=True).click()
    page.get_by_role("button", name="Redefinir senha").click()
    page.wait_for_timeout(300)

    page.get_by_role("button", name="Ações da hospedagem").click()
    page.get_by_text("Alterar plano ou pacote", exact=True).click()
    page.get_by_role("combobox").click()
    page.get_by_text("Hospedagem Premium", exact=False).click()
    page.get_by_role("button", name="Alterar plano", exact=True).click()
    page.wait_for_timeout(300)

    page.get_by_role("button", name="Ações da hospedagem").click()
    page.get_by_text("Excluir hospedagem", exact=True).click()
    page.get_by_role("button", name="Excluir permanentemente").click()
    page.wait_for_timeout(300)

    assert requested_operations == [
        {"operation": "change_password"},
        {"operation": "change_package", "target_plan_id": 2},
        {"operation": "delete"},
    ]

    page.set_viewport_size({"width": 375, "height": 812})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.get_by_text(account["fqdn"], exact=True).click()
    page.get_by_text("Diagnóstico e ações administrativas por recurso.").wait_for()
    dialog = page.locator('[data-slot="dialog-content"]')
    dialog_width = dialog.evaluate("element => element.scrollWidth")
    dialog_client_width = dialog.evaluate("element => element.clientWidth")
    document_width = page.evaluate("document.documentElement.scrollWidth")
    page.screenshot(path=str(OUTPUT / "admin-hosting-resources-mobile.png"))

    print(f"desktop_and_tabs=ok")
    print(f"mobile_document_width={document_width} viewport=375")
    print(f"mobile_dialog_width={dialog_width} client={dialog_client_width}")
    print(f"browser_errors={len(errors)}")
    print(f"sensitive_operations={requested_operations}")
    for error in errors:
        print(error)
    browser.close()

    if document_width > 375 or dialog_width > dialog_client_width or errors:
        raise SystemExit(1)
