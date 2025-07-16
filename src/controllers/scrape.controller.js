// src/controllers/scrape.controller.js (Updated for single career handling)
import { scrapeCollegeData } from '../services/scraper.js';
import Career from '../models/Career.js';

// @desc    Trigger the college website scraper and save data to DB
// @route   POST /api/scrape/college-data
// @access  Private (Admin only)
export const triggerCollegeDataScrape = async (req, res) => {
  const { url, debug } = req.body; // Added debug for direct save trigger if needed

  if (!url) {
    return res.status(400).json({ message: 'Scraping URL is required.' });
  }

  try {
    console.log(`[Scrape Controller] Initiating scrape for URL: ${url} (Debug mode: ${!!debug})`);
    const scrapedCareer = await scrapeCollegeData(url, !!debug); // Expect a single career object

    if (!scrapedCareer) { // Check if a career object was actually returned
      return res.status(200).json({ message: 'Scraping completed, but no career data was extracted from this URL.', data: null });
    }

    // --- Save scraped data to MongoDB (for a single career) ---
    let result = {};
    try {
      // Try to find an existing career by name
      let existingCareer = await Career.findOne({ name: scrapedCareer.name });

      if (existingCareer) {
        // If career exists, update its semesters (this will replace the entire semesters array)
        existingCareer.semesters = scrapedCareer.semesters;
        await existingCareer.save();
        result = { name: scrapedCareer.name, status: 'updated', id: existingCareer._id };
        console.log(`[Scrape Controller] Updated existing career: ${scrapedCareer.name}`);
      } else {
        // If career does not exist, create a new one
        const newCareer = new Career(scrapedCareer);
        await newCareer.save();
        result = { name: scrapedCareer.name, status: 'created', id: newCareer._id };
        console.log(`[Scrape Controller] Created new career: ${scrapedCareer.name}`);
      }
    } catch (dbError) {
      if (dbError.code === 11000) { // Duplicate key error
          console.warn(`[Scrape Controller] Duplicate career name found during save: ${scrapedCareer.name}. Skipping.`);
          result = { name: scrapedCareer.name, status: 'skipped_duplicate' };
      } else {
          console.error(`[Scrape Controller] Error saving career ${scrapedCareer.name} to DB:`, dbError);
          result = { name: scrapedCareer.name, status: 'failed', error: dbError.message };
      }
    }

    res.status(200).json({
      message: 'Scraping and database population completed for a single career.',
      scrapedCareerName: scrapedCareer.name,
      dbResult: result // Return single result
    });

  } catch (error) {
    console.error('[Scrape Controller] Error triggering scrape:', error);
    res.status(500).json({ message: 'Failed to trigger scraping process.', error: error.message });
  }
};


// @desc    Trigger the college website scraper and return data without saving to DB
// @route   POST /api/scrape/preview-college-data
// @access  Private (Admin only)
export const previewCollegeDataScrape = async (req, res) => {
  const { url, debug } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'Scraping URL is required.' });
  }

  try {
    console.log(`[Scrape Controller] Initiating PREVIEW scrape for URL: ${url} (Debug mode: ${!!debug})`);
    const scrapedCareer = await scrapeCollegeData(url, !!debug); // Expect a single career object

    if (!scrapedCareer) { // Check if a career object was actually returned
      return res.status(200).json({ message: 'Preview scrape completed, but no career data was extracted from this URL.', data: null });
    }

    // Just return the single scraped career data without saving to the database
    res.status(200).json({
      message: 'Preview scrape completed. Single career data returned without saving to database.',
      scrapedCareerName: scrapedCareer.name,
      data: scrapedCareer // Return the single career object
    });

  } catch (error) {
    console.error('[Scrape Controller] Error during preview scrape:', error);
    res.status(500).json({ message: 'Failed to complete preview scraping process.', error: error.message });
  }
};