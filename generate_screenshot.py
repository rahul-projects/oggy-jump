from playwright.sync_api import sync_playwright
import time

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(record_video_dir=".")
        page.goto("http://localhost:8000/dist/index.html")

        # Let it run until game over
        for i in range(30):
            game_over_display = page.evaluate("document.getElementById('game-over').style.display")
            if game_over_display == "block":
                break
            time.sleep(0.2)

        page.screenshot(path="screenshot.png")
        video_path = page.video.path()
        browser.close()

        # rename video to something predictable
        import os
        os.rename(video_path, "video.webm")

take_screenshot()
