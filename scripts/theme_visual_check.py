from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "storage" / "app" / "visual-tests"
OUTPUT.mkdir(parents=True, exist_ok=True)

EXPECTED = {
    "--be-background": "#080916",
    "--be-card": "#111426",
    "--be-primary": "#625deb",
    "--be-border": "#292c44",
    "--be-input": "#606487",
}


with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        device_scale_factor=1,
    )
    context.add_cookies(
        [
            {
                "name": "be-color-scheme",
                "value": "dark",
                "url": "http://127.0.0.1:8011",
            }
        ]
    )
    page = context.new_page()
    page.goto("http://127.0.0.1:8011/login", wait_until="networkidle")

    values = page.evaluate(
        """
        (tokens) => {
          const styles = getComputedStyle(document.documentElement);
          return Object.fromEntries(
            tokens.map(token => [token, styles.getPropertyValue(token).trim().toLowerCase()]),
          );
        }
        """,
        list(EXPECTED),
    )

    assert values == EXPECTED, f"Unexpected dark theme values: {values}"
    page.screenshot(path=str(OUTPUT / "theme-login-dark.png"), full_page=True)
    print(" ".join(f"{token}={value}" for token, value in values.items()))
    print("dark theme visual check passed")
    browser.close()
