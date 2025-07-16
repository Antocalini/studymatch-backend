// src/services/scraper.js (Updated for title scraping and formatting)
import puppeteer from 'puppeteer';

/**
 * Scrapes a single college career's academic data (Semesters, Subjects) from a given URL.
 * You will need to fill in the specific CSS selectors based on your college website's structure.
 *
 * @param {string} url - The URL of the college website page to scrape (expected to contain one career's data).
 * @param {boolean} [debug=false] - If true, launches browser in non-headless mode and keeps it open for inspection.
 * @returns {Promise<Object|null>} - A promise that resolves to a single career object, or null if not found.
 */
export const scrapeCollegeData = async (url, debug = false) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: !debug });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);

    page.on('console', (msg) => {
      console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
    });
    page.on('pageerror', (err) => {
      console.error('[BROWSER PAGE ERROR]:', err);
    });

    console.log(`[Scraper Service] Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    console.log('[Scraper Service] Page loaded. Starting single career data extraction...');

    const scrapedCareer = await page.evaluate(() => {
      // --- 1. Scrape and format the career name from the <title> tag ---
      const pageTitle = document.querySelector('title')?.innerText;
      let careerName = null;

      if (pageTitle) {
        // Split by '|' and take the first part (the career name)
        const careerPart = pageTitle.split('|')[0]?.trim();

        if (careerPart) {
          // Replace ", mención" with ": Mención" and capitalize 'Mención'
          // Use a regex with 'i' flag for case-insensitive matching if needed
          careerName = careerPart.replace(/,\s*mención/i, ': Mención');
        }
      }

      if (!careerName) {
        console.error('Could not extract career name from page title!');
        return null; // Return null if the career name cannot be determined
      }

      console.log('Extracted Career Name:', careerName); // This will appear in your Node.js console

      // --- 2. Continue with scraping semesters and subjects (your existing logic) ---
      const semesters = [];

      const cardElements = document.querySelectorAll('.card-container');
      const semesterElements = [...cardElements].filter(semesterEl => /semestre/i.test(semesterEl.children[0].textContent));

      
      // Selectors

       semesterElements.forEach((semesterEl, index) => {
         const semesterNumber = index + 1;
         const semesterName = semesterEl.children[0].textContent;
         console.log('  Extracting semester:', semesterNumber)
         const subjects = [];
         const [...subjectElements] = semesterEl.children[1].children;

         subjectElements.forEach(subjectEl => {
           const subjectName = subjectEl.children[0].textContent.replace(/\d+/g,'').trim() //we get rid of the credits
           subjects.push({ name: subjectName });
           console.log('    Found subject:', subjectName);
         });
         semesters.push({ number: semesterNumber, name: semesterName, subjects: subjects });
       });

      return {
        name: careerName, // Use the dynamically scraped careerName
        semesters
      };
    });

    if (!scrapedCareer) {
        console.warn('[Scraper Service] No career data extracted from the page.');
    } else {
        console.log(`[Scraper Service] Single career "${scrapedCareer.name}" extracted.`);
    }

    return scrapedCareer;

  } catch (error) {
    console.error('[Scraper Service] Error during scraping:', error);
    throw new Error(`Scraping failed: ${error.message}`);
  } finally {
    if (browser && !debug) {
      await browser.close();
      console.log('[Scraper Service] Browser closed.');
    } else if (debug) {
      console.log('[Scraper Service] Browser kept open for debugging (debug mode is ON). Please close manually.');
    }
  }
};