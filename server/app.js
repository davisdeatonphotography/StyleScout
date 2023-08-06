try {
  require('dotenv').config();
} catch (err) {
  console.warn("No .env file found. Assuming production environment variables are set.");
}


const fs = require('fs');
const validator = require('validator');
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const puppeteer = require('puppeteer');
const winston = require('winston');
const path = require('path');


console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Create Express app
const app = express();

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, stack, timestamp }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      if (stack) {
        log += `\n${stack}`;
      }
      return log;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log' }),
  ],
});
let requestCount = 0;

async function sendRequestWithRetry(cssContent, retries = 5, delay = 5 * 60 * 1000) {
  try {
    const tokens = cssContent.length + 'gpt-3.5-turbo'.length;
    logger.info(`Tokens in request: ${tokens}`);
    requestCount++;
    logger.info(`Sending request number ${requestCount}`);

    const truncatedContent = truncate(cssContent, MAX_TOKENS);

    const analysis = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an AI trained to analyze CSS.' },
        { role: 'user', content: truncatedContent },
      ],
    });

    logger.info('Received response from OpenAI API:', analysis);
    return analysis;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      if (retries > 0) {
        const retryAfter = parseInt(error.response.headers['retry-after'], 10) || delay;
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return sendRequestWithRetry(cssContent, retries - 1, delay);
      } else {
        logger.error('No more retries left. Please reduce the frequency of your requests.');
        throw error;
      }
    } else {
      logger.error('Error sending request to OpenAI API:', error);
      logger.error('Error response body:', error.response.data);
      throw error;
    }
  }
}

const MAX_TOKENS = 100; // Maximum number of tokens allowed in a request

// Truncate the text to the maximum number of tokens
function truncate(text, maxTokens) {
  return text.slice(0, maxTokens);
}

// Function to filter out unwanted CSS content
function filterCssContent(cssContent) {
  // Remove comments from CSS
  cssContent = cssContent.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '');

  // Remove media queries from CSS
  cssContent = cssContent.replace(/@media[^{]+{[\s\S]+?}/g, '');

  // Remove keyframes from CSS
  cssContent = cssContent.replace(/@keyframes[^{]+{[\s\S]+?}/g, '');

  // Remove !important declarations from CSS
  cssContent = cssContent.replace(/!important/g, '');

  // Remove empty lines and extra spaces from CSS
  cssContent = cssContent.replace(/\s+/g, ' ').trim();

  return cssContent;
}

async function getCssContentFromUrl(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Extract CSS content from the URL
  const cssContent = await page.evaluate(() => {
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    return styles
      .map((style) => style.textContent)
      .filter((content) => content.trim().length > 0)
      .join('\n');
  });

  await browser.close();

  return cssContent;
}

async function getColorsFromPage(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Extract color values from the page
  const colors = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const colorProperties = ['color', 'background-color'];
    const colorValues = new Set();

    elements.forEach((element) => {
      const styles = getComputedStyle(element);
      colorProperties.forEach((property) => {
        const color = styles.getPropertyValue(property);
        if (color && color !== 'rgba(0, 0, 0, 0)') {
          colorValues.add(color);
        }
      });
    });

    return Array.from(colorValues);
  });

  await browser.close();

  return colors;
}

async function getFontsFromPage(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Extract font values from the page
  const fonts = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const fontProperties = ['font-family', 'font-size'];
    const fontValues = new Set();

    elements.forEach((element) => {
      const styles = getComputedStyle(element);
      fontProperties.forEach((property) => {
        const font = styles.getPropertyValue(property);
        if (font) {
          fontValues.add(font);
        }
      });
    });

    return Array.from(fontValues);
  });

  await browser.close();

  return fonts;
}

function calculateScore(category, analysis) {
  // Placeholder scoring logic
  let score = 0;

  // Calculate score based on the category and analysis data
  switch (category) {
    case "Color Scheme":
      // Calculate score based on the harmony and contrast of the colors
      const harmonyScore = Math.floor(Math.random() * 11); // Random score between 0 and 10
      const contrastScore = Math.floor(Math.random() * 11); // Random score between 0 and 10
      score = (harmonyScore + contrastScore) / 2; // Average score
      break;
    case "Typography":
      // Calculate score based on the readability and suitability of the fonts
      const readabilityScore = Math.floor(Math.random() * 11); // Random score between 0 and 10
      const suitabilityScore = Math.floor(Math.random() * 11); // Random score between 0 and 10
      score = (readabilityScore + suitabilityScore) / 2; // Average score
      break;
    case "Layout and Spacing":
      // Calculate score based on the overall layout and spacing used in the design
      score = Math.floor(Math.random() * 11); // Random score between 0 and 10
      break;
    case "Design Principles":
      // Calculate score based on the adherence to design principles evident in the CSS code
      score = Math.floor(Math.random() * 11); // Random score between 0 and 10
      break;
    case "Imagery and Graphics":
      // Calculate score based on the quality and relevance of the imagery and graphics used
      score = Math.floor(Math.random() * 11); // Random score between 0 and 10
      break;
    default:
      score = 0; // Default score if category is not recognized
  }

  return score;
}

const analyzeWebsite = async (req, res) => {
  try {
    const { url } = req.body;

    // Check if URL is provided
    if (!url) {
      logger.error('URL is required.');
      res.status(400).json({ error: 'URL is required.' });
      return;
    }

    // Validate URL
    if (!validator.isURL(url)) {
      logger.error('Invalid URL:', url);
      res.status(400).json({ error: 'Invalid URL.' });
      return;
    }

    logger.info('Navigating to URL:', url);

    const cssContent = await getCssContentFromUrl(url);

    logger.info('CSS content:', cssContent);

    // Filter out unwanted CSS content
    const filteredCssContent = filterCssContent(cssContent);

    logger.info('Filtered CSS content:', filteredCssContent);

    // Analyze the color and background-color properties of the captured styles
    const colors = await getColorsFromPage(url);

    // Analyze the font-family and font-size properties of the captured styles
    const fonts = await getFontsFromPage(url);

    // Prepare a more detailed prompt for the OpenAI API
    const prompt = `You are an AI trained to analyze CSS. Please provide a detailed analysis of the following categories based on the provided CSS code:

    1. Color Scheme: Identify the primary and secondary colors used and assess their harmony and contrast.
    2. Typography: Identify the font families used and evaluate their readability and suitability for the website's purpose.
    3. Layout and Spacing: Describe the overall layout and spacing used in the design.
    4. Design Principles: Identify any prominent design principles evident in the CSS code.
    5. Imagery and Graphics: Evaluate the quality and relevance of the imagery and graphics used.
    
    CSS Code:
    ${filteredCssContent}`;

    // Truncate the prompt to the maximum number of tokens
    const truncatedPrompt = truncate(prompt, MAX_TOKENS);

    // Send the captured CSS to the OpenAI API for text generation
    logger.info('Sending request to OpenAI API');

    const analysis = await sendRequestWithRetry(filteredCssContent);

    // Analyze and score each category
    const categories = ["Color Scheme", "Typography", "Layout and Spacing", "Design Principles", "Imagery and Graphics"];
    const categoryAnalysis = {};
    for (let category of categories) {
      const categoryPrompt = `Analyze the ${category} used in this CSS: ${filteredCssContent}`;
      const categoryAnalysisResponse = await sendRequestWithRetry(categoryPrompt);
      const score = calculateScore(category, categoryAnalysisResponse);
      categoryAnalysis[category] = {
        analysis: categoryAnalysisResponse.data.choices[0].message.content,
        score: score
      };
    }

    res.json({ css: filteredCssContent, colors, fonts, categoryAnalysis, analysis: analysis.data.choices[0].message.content });
  } catch (error) {
    logger.error('An error occurred while analyzing the website:', error);
    res.status(500).json({ error: 'An error occurred while analyzing the website.', details: error });
  }
}

// Route to analyze site CSS
app.post('/analyze', analyzeWebsite);

// New route to serve the screenshot
app.get('/screenshot', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/screenshots/screenshot.png'));
});

// Global error handler middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
  });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
