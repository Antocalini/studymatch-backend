// src/controllers/scrape.controller.js
import { scrapeCollegeData } from '../services/scraper.js';
import Career from '../models/Career.js'; // To save the scraped data

// @desc    Trigger the college website scraper and save data to DB
// @route   POST /api/scrape/college-data
// @access  Private (Admin only)
export const triggerCollegeDataScrape = async (req, res) => {
  const { url } = req.body; // Expect the URL to scrape from the request body

  if (!url) {
    return res.status(400).json({ message: 'Scraping URL is required.' });
  }

  try {
    console.log(`[Scrape Controller] Initiating scrape for URL: ${url}`);
    const scrapedCareers = await scrapeCollegeData(url);

    if (!scrapedCareers || scrapedCareers.length === 0) {
      return res.status(200).json({ message: 'Scraping completed, but no career data was extracted.', data: [] });
    }

    // --- Save scraped data to MongoDB ---
    // This logic assumes the scraped data matches the structure of your Career model.
    // It will attempt to insert or update careers.
    const results = [];
    for (const careerData of scrapedCareers) {
      try {
        // Try to find an existing career by name
        let existingCareer = await Career.findOne({ name: careerData.name });

        if (existingCareer) {
          // If career exists, update its semesters (this will replace the entire semesters array)
          existingCareer.semesters = careerData.semesters;
          await existingCareer.save();
          results.push({ name: careerData.name, status: 'updated', id: existingCareer._id });
          console.log(`[Scrape Controller] Updated existing career: ${careerData.name}`);
        } else {
          // If career does not exist, create a new one
          const newCareer = new Career(careerData);
          await newCareer.save();
          results.push({ name: careerData.name, status: 'created', id: newCareer._id });
          console.log(`[Scrape Controller] Created new career: ${careerData.name}`);
        }
      } catch (dbError) {
        if (dbError.code === 11000) { // Duplicate key error
            console.warn(`[Scrape Controller] Duplicate career name found during save: ${careerData.name}. Skipping.`);
            results.push({ name: careerData.name, status: 'skipped_duplicate' });
        } else {
            console.error(`[Scrape Controller] Error saving career ${careerData.name} to DB:`, dbError);
            results.push({ name: careerData.name, status: 'failed', error: dbError.message });
        }
      }
    }

    res.status(200).json({
      message: 'Scraping and database population completed.',
      scrapedCount: scrapedCareers.length,
      dbResults: results
    });

  } catch (error) {
    console.error('[Scrape Controller] Error triggering scrape:', error);
    res.status(500).json({ message: 'Failed to trigger scraping process.', error: error.message });
  }
};