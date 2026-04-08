from playwright.sync_api import sync_playwright
import time

def verify_collision():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000/dist/index.html")

        # Wait a bit
        time.sleep(1)

        # Check score and game over status over 10 seconds
        for i in range(50):
            score = page.locator("#score").inner_text()
            game_over_display = page.evaluate("document.getElementById('game-over').style.display")

            oggy_rect = page.evaluate("document.getElementById('oggy').getBoundingClientRect()")
            cockroach_rect = page.evaluate("document.getElementById('cockroach').getBoundingClientRect()")

            print(f"Time {i*0.2:.1f}s | Score: {score} | Game Over: {game_over_display}")
            print(f"Oggy: L={oggy_rect['left']:.1f}, R={oggy_rect['right']:.1f}, B={oggy_rect['bottom']:.1f}")
            print(f"Cockroach: L={cockroach_rect['left']:.1f}, R={cockroach_rect['right']:.1f}, T={cockroach_rect['top']:.1f}")

            if game_over_display == "block":
                print("Collision detected successfully!")
                break

            time.sleep(0.2)

        browser.close()

verify_collision()
