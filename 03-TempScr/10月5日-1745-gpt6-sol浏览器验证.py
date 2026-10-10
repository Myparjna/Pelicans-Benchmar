from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "02-TempFiles" / "gpt6-sol-validation"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/" + quote("gpt6-sol-鹈鹕白天骑自行车动画.html")


def inspect(page, label):
    result = page.evaluate("""() => ({
        weather: document.querySelector('.scene').dataset.weather,
        name: document.querySelector('#weather-name').textContent,
        viewport: [innerWidth, innerHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        bike: (() => { const b = document.querySelector('.bike-and-bird').getBoundingClientRect();
            return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)]; })()
    })""")
    page.screenshot(path=str(OUT / f"{label}.png"))
    print(label, result)
    assert result["scroll"] == result["viewport"], "页面发生溢出"
    return result


with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://127.0.0.1:9301")
    context = browser.contexts[0]
    page = context.new_page()
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto(URL, wait_until="load")
    states = [inspect(page, "desktop-sunny")]
    for label in ("desktop-cloudy", "desktop-rainy", "desktop-sunny-again"):
        page.wait_for_timeout(5050)
        states.append(inspect(page, label))
    assert [x["weather"] for x in states] == ["sunny", "cloudy", "rainy", "sunny"]
    page.set_viewport_size({"width": 390, "height": 844})
    page.reload(wait_until="load")
    mobile = inspect(page, "mobile-sunny")
    page.wait_for_timeout(5050)
    mobile_cloudy = inspect(page, "mobile-cloudy")
    assert mobile["bike"][0] >= 0 and mobile["bike"][2] <= 390, "手机画面裁切骑行主体"
    assert mobile_cloudy["weather"] == "cloudy"
    page.set_viewport_size({"width": 320, "height": 720})
    page.reload(wait_until="load")
    narrow = inspect(page, "mobile-narrow-sunny")
    assert narrow["bike"][0] >= 0 and narrow["bike"][2] <= 320, "窄屏画面裁切骑行主体"
    page.close()
    browser.close()
