import json
import re
import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
from dotenv import load_dotenv

def scrape_putnam_problems():
    load_dotenv()
    login_id = os.getenv("LOGIN_ID")
    password = os.getenv("PASSWORD")

    with open('links.json', 'r') as f:
        links = json.load(f)

    all_problems = {}

    # Set up Selenium WebDriver for Safari
    options = webdriver.SafariOptions()
    driver = webdriver.Safari(options=options)

    try:
        # Login
        login_url = "https://login.artofproblemsolving.com/login"
        driver.get(login_url)
        time.sleep(2) # Wait for page to load

        driver.find_element(By.ID, 'login-id').send_keys(login_id)
        driver.find_element(By.ID, 'password').send_keys(password)
        driver.find_element(By.ID, 'login-button').click()
        time.sleep(5) # Wait for login to complete

        for url in links:
            driver.get(url)
            time.sleep(2) # Wait for page to load

            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            year_match = re.search(r'(\d{4})_putnam', url)
            if not year_match:
                year_match = re.search(r'putnam_(\d{4})', url)
            
            if not year_match:
                if "1958_february_putnam" in url:
                    year = "1958_february"
                elif "1958_november_putnam" in url:
                    year = "1958_november"
                else:
                    print(f"Could not extract year from {url}")
                    continue
            else:
                year = year_match.group(1)

            if year not in all_problems:
                all_problems[year] = []

            # Only select problem statements that are immediately preceded by their label
            problem_text_divs = soup.select('div.cmty-view-post-item-label + div.cmty-view-post-item-text')
            for div in problem_text_divs:
                label_div = div.find_previous_sibling('div', class_='cmty-view-post-item-label')
                problem_number = label_div.get_text(strip=True) if label_div else None
                for img in div.find_all('img'):
                    alt_text = img.get('alt', '')
                    img.replace_with(alt_text)
                problem_text = div.get_text(separator=' ', strip=True)
                if problem_number:
                    all_problems[year].append({
                        "problem": problem_text,
                        "question": problem_number
                    })

    finally:
        driver.quit()

    with open('putnam_problems.json', 'w') as f:
        json.dump(all_problems, f, indent=4)

if __name__ == '__main__':
    scrape_putnam_problems()
    print("Scraping complete. Problems saved to putnam_problems.json")
