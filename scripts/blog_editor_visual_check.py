import re
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)


def category_response():
    return {
        "data": [
            {
                "id": 991101,
                "name": "Tutoriais",
                "slug": "tutoriais",
                "description": "Guias de publicacao e hospedagem.",
                "seo_title": None,
                "seo_description": None,
                "sort_order": 1,
                "posts_count": 0,
                "published_posts_count": 0,
                "created_at": "2026-08-17T12:00:00-03:00",
                "updated_at": "2026-08-17T12:00:00-03:00",
                "deleted_at": None,
                "model_type": "blogCategory",
            }
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
        "**/api/v1/admin/blog/categories*",
        lambda route: route.fulfill(json=category_response()),
    )

    page.goto("http://127.0.0.1:8011/login")
    page.wait_for_load_state("networkidle")
    if "/login" in page.url:
        page.locator('input[name="email"]').fill(
            "codex-admin-hosting-visual@example.test"
        )
        page.locator('input[name="password"]').fill("VisualTest-2026!")
        page.locator('button[type="submit"]').click()
        page.wait_for_url("**/dashboard**")

    page.goto("http://127.0.0.1:8011/admin/blog/new")
    page.wait_for_load_state("networkidle")

    editor = page.locator(".ProseMirror")
    try:
        editor.wait_for()
    except Exception:
        page.screenshot(
            path=str(OUTPUT / "blog-editor-reconnaissance.png"), full_page=True
        )
        print(f"editor_url={page.url}")
        print(f"editor_title={page.title()}")
        print(f"editor_body={page.locator('body').inner_text()[:1500]}")
        for error in errors:
            print(error)
        browser.close()
        raise

    editor.fill("Este e o conteudo principal do artigo.")

    title = page.locator("h1").filter(has_text=re.compile("T.tulo|Title")).first
    title.click()
    title_input = page.locator(
        'input[placeholder="T\u00edtulo"], input[placeholder="Title"]'
    )
    title_input.fill("Como publicar seu primeiro site")
    title_input.press("Tab")

    image_button = page.get_by_role(
        "button", name=re.compile("Inserir imagem|Insert image", re.IGNORECASE)
    )
    image_button.wait_for()
    assert image_button.is_visible()
    assert page.get_by_text(
        re.compile("destaque|Featured image", re.IGNORECASE)
    ).is_visible()
    assert page.locator('input[type="file"]').count() >= 1

    desktop_width = page.evaluate("document.documentElement.scrollWidth")
    page.screenshot(path=str(OUTPUT / "blog-editor-desktop.png"), full_page=True)

    page.set_viewport_size({"width": 390, "height": 844})
    page.reload()
    page.wait_for_load_state("networkidle")
    page.locator(".ProseMirror").wait_for()
    mobile_image_button = page.get_by_role(
        "button", name=re.compile("Inserir imagem|Insert image", re.IGNORECASE)
    )
    mobile_image_button.wait_for()
    mobile_width = page.evaluate("document.documentElement.scrollWidth")
    page.screenshot(path=str(OUTPUT / "blog-editor-mobile.png"), full_page=True)

    print(f"desktop_document_width={desktop_width} viewport=1440")
    print(f"mobile_document_width={mobile_width} viewport=390")
    print(f"browser_errors={len(errors)}")
    for error in errors:
        print(error)

    browser.close()

    if desktop_width > 1440 or mobile_width > 390 or errors:
        raise SystemExit(1)
