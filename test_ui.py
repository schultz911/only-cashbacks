from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:3000")
        time.sleep(2) # let it load
        page.screenshot(path="screenshot.png")
        print("Screenshot saved to screenshot.png")

        # Optionally record a video by defining a record_video_dir on new_context
        browser.close()

if __name__ == "__main__":
    run()
