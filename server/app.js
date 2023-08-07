require('dotenv').config();

const fs = require('fs');
const validator = require('validator');
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const puppeteer = require('puppeteer');
const winston = require('winston');
const path = require('path');

// Read .env file
const envFileContents = fs.readFileSync(path.join(__dirname, '/../.env'), 'utf-8');

// Split file into lines
const lines = envFileContents.split('\n');

// Parse lines into key-value pairs
const env = {};
lines.forEach((line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);



// OpenAI API Integration
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;  // Ensure this key is set in the .env file

async function analyzeWithOpenAI(cssData) {
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
    };
    const body = {
        model: "gpt-3.5-turbo-16k",
        messages: [
            { role: 'system', content: 'Analyze the provided CSS data and provide comprehensive feedback.' },
            { role: 'user', content: cssData }
        ]
    };
    const response = await fetch(OPENAI_API_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    const data = await response.json();
    return data.choices[0].message.content.trim();
}



app.post('/analyze', async (req, res) => {
    try {
        const { cssData } = req.body;
        
        // Validate and sanitize the incoming data
        if (!cssData || typeof cssData !== 'string') {
            return res.status(400).json({ error: 'Invalid CSS data provided.' });
        }

        const analysis = await getAnalysisFromOpenAI(cssData);
        const score = calculateScore(analysis);
        
        res.json({ analysis, score });
    } catch (error) {
        console.error('Error during OpenAI API call:', error);
        res.status(500).json({ error: 'Failed to analyze the CSS data. Please try again later.' });
    }
});

    try {
        const { cssData } = req.body;
        
        // Construct the prompt for OpenAI based on the received CSS data
        const prompt = `Analyze the following CSS data and provide insights: ${cssData}`;
        
        // Make a call to OpenAI API
        const openaiResponse = await openai.createCompletion({
            model: "gpt-3.5-turbo-16k",
            prompt: prompt,
            maxTokens: 4096 // Limit the response length
        });
        
        // Send the generated description back to the client
        res.json({ description: openaiResponse.data.choices[0].text.trim() });
        
    } catch (error) {
        console.error("Error analyzing CSS with OpenAI:", error);
        res.status(500).json({ error: "Failed to analyze with OpenAI" });
    }
});

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

const MAX_TOKENS = 4096; // Maximum number of tokens allowed in a request

// Truncate the text to the maximum number of tokens

// Truncate the text to the maximum number of tokens without breaking the CSS structure
function truncate(text, maxTokens) {
    const initialTruncate = text.slice(0, maxTokens);
    const lastBrace = initialTruncate.lastIndexOf("}");
    
    if (lastBrace !== -1) {
        return initialTruncate.slice(0, lastBrace + 1);
    }
    
    return initialTruncate;
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
  const browser = await puppeteer.launch({ headless: 'new' });
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


function calculateHarmonyScore(colors) {
    // Placeholder logic, can be enhanced
    return colors.length * 2;  // example logic
}

function calculateContrastScore(colors) {
    // Placeholder logic, can be enhanced
    return colors.length * 3;  // example logic
}

function calculateReadabilityScore(fonts) {
    // Placeholder logic, can be enhanced
    return fonts.length * 4;  // example logic
}

function calculateSuitabilityScore(fonts) {
    // Placeholder logic, can be enhanced
    return fonts.length * 5;  // example logic
}
function calculateScore(category, analysis) {
  // Placeholder scoring logic
  let score = 0;

  // Calculate score based on the category and analysis data
  switch (category) {
    case "Color Scheme":
      // Calculate score based on the harmony and contrast of the colors
      const harmonyScore = calculateHarmonyScore(colors); // Random score between 0 and 10
      const contrastScore = calculateContrastScore(colors); // Random score between 0 and 10
      
function calculateHarmonyScore(colors) {
    // Placeholder logic: more comprehensive analysis can be done based on the colors array
    const uniqueColors = new Set(colors);
    const diversityScore = uniqueColors.size / 10; // Score based on the diversity of colors
    const coherenceScore = 1 - diversityScore; // Score based on the coherence of the color palette

    return (diversityScore + coherenceScore) / 2;
}

function calculateContrastScore(colors) {
    // Placeholder logic: a more refined method would analyze the contrast between primary text color and background color
    const primaryColor = colors[0]; // Assuming first color is primary
    const backgroundColor = colors[colors.length - 1]; // Assuming last color is background

    // Check if primary and background colors are sufficiently different
    const contrast = primaryColor !== backgroundColor ? 1 : 0;

    return contrast * 10; // Convert to a score out of 10
}

score = (harmonyScore + contrastScore) / 2; // Average score
      break;
    case "Typography":
      // Calculate score based on the readability and suitability of the fonts
      const readabilityScore = calculateReadabilityScore(fonts); // Random score between 0 and 10
      const suitabilityScore = calculateSuitabilityScore(fonts); // Random score between 0 and 10
      
function calculateReadabilityScore(fonts) {
    // Placeholder logic: more comprehensive analysis can be done based on the fonts array
    const common_fonts = ["Arial", "Helvetica", "Times New Roman", "Verdana", "Tahoma", "Georgia"];
    const used_common_fonts = fonts.filter(font => common_fonts.includes(font));
    const readabilityScore = (used_common_fonts.length / common_fonts.length) * 10;

    return readabilityScore;
}

function calculateSuitabilityScore(fonts) {
    // Placeholder logic: sans-serif fonts might be preferred for web content
    const preferred_fonts = ["Arial", "Helvetica", "Verdana", "Tahoma"];
    const used_preferred_fonts = fonts.filter(font => preferred_fonts.includes(font));
    const suitabilityScore = (used_preferred_fonts.length / preferred_fonts.length) * 10;

    return suitabilityScore;
}

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

async function getCssContentFromUrl(url) {
    const browser = await 
async function analyzeWithPuppeteer(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the provided URL
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Extract design elements
    const extractedData = await page.evaluate(() => {
        return {
            css: [...document.styleSheets].map(sheet => {
                try {
                    return [...sheet.cssRules].map(rule => rule.cssText).join('\n');
                } catch (e) {
                    return '';
                }
            }).join('\n'),
            fonts: window.getComputedStyle(document.body).fontFamily,
            color: window.getComputedStyle(document.body).color,
            backgroundColor: window.getComputedStyle(document.body).backgroundColor
        };
    });

    // Capture screenshot
    const screenshotPath = path.join(__dirname, '../public/screenshots/screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browser.close();

    return extractedData;
}

    const page = await browser.newPage();
    
    // Navigate to the given URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Extract CSS content from the webpage
    const cssContent = await page.evaluate(() => {
        const styleSheets = [...document.styleSheets];
        let extractedStyles = '';
        
        styleSheets.forEach((sheet) => {
            try {
                if (sheet.cssRules) {
                    const rules = [...sheet.cssRules];
                    rules.forEach((rule) => {
                        extractedStyles += rule.cssText;
                    });
                }
            } catch (error) {
                console.error('Error reading styles from a stylesheet:', error);
            }
        });
        
        return extractedStyles;
    });

    await browser.close();
    return cssContent;
}

async function analyzeCssWithOpenAI(cssContent) {
    // Filter and truncate CSS content
    cssContent = filterCssContent(cssContent);
    cssContent = truncate(cssContent, MAX_TOKENS);

    // Send the filtered CSS to the OpenAI API
    try {
        const analysis = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are an AI trained to analyze CSS and provide comprehensive feedback on design and structure.' },
                { role: 'user', content: cssContent },
            ],
        });

        // Return the analysis
        return analysis.data.choices[0].message.content;
    } catch (error) {
        logger.error('Error interacting with OpenAI API:', error);
        throw new Error('Error analyzing CSS with OpenAI.');
    }
}

// Server endpoint to analyze a website's design

app.post('/analyze', async (req, res) => {
    try {
        const { cssData } = req.body;
        
        // Validate and sanitize the incoming data
        if (!cssData || typeof cssData !== 'string') {
            return res.status(400).json({ error: 'Invalid CSS data provided.' });
        }

        const analysis = await getAnalysisFromOpenAI(cssData);
        const score = calculateScore(analysis);
        
        res.json({ analysis, score });
    } catch (error) {
        console.error('Error during OpenAI API call:', error);
        res.status(500).json({ error: 'Failed to analyze the CSS data. Please try again later.' });
    }
});

    try {
        const { url } = req.body;

        // Get CSS content from the provided URL
        const cssContent = await getCssContentFromUrl(url);

        // Get analysis from OpenAI
        const analysis = await analyzeCssWithOpenAI(cssContent);

        // Return the analysis to the frontend
        res.json({ analysis });
    } catch (error) {
        logger.error('Error analyzing website:', error);
        res.status(500).json({ error: 'Error analyzing website.' });
    }
});

// Enhanced Puppeteer integration
async function getEnhancedCssContentFromUrl(url) {
    // Use Puppeteer to fetch all stylesheets, inline styles, and other relevant CSS
    //...
    return allCssContent;
}

async function getEnhancedColorsFromPage(url) {
    // Use Puppeteer to fetch all unique color values from the entire webpage
    //...
    return uniqueColors;
}

async function getEnhancedFontsFromPage(url) {
    // Use Puppeteer to fetch all unique font values from the entire webpage, including variants and weights
    //...
    return uniqueFonts;
}

// Enhanced Scoring System
function calculateHarmonyScore(colors) {
    // Placeholder logic for harmony score based on number of unique colors
    // In a real-world scenario, this would be more complex and consider color theory
    return (colors.length > 5) ? 5 : 10;
}

function calculateContrastScore(colors) {
    // Placeholder logic for contrast score based on number of unique colors
    // Ideally, this would use a library to calculate actual contrast ratios
    return (colors.length > 3) ? 7 : 10;
}

function calculateReadabilityScore(fonts) {
    // Placeholder logic for readability score based on number of unique fonts
    return (fonts.length > 3) ? 7 : 10;
}

function calculateSuitabilityScore(fonts) {
    // Placeholder logic for suitability score based on number of unique fonts
    return (fonts.length > 2) ? 7 : 10;
}

function calculateLayoutScore(css) {
    // Placeholder logic for layout score based on the presence of certain CSS properties
    return (css.includes('margin') && css.includes('padding')) ? 10 : 7;
}

function calculateDesignPrinciplesScore(css) {
    // Placeholder logic for design principles score
    return (css.includes('flex') || css.includes('grid')) ? 10 : 8;
}

function calculateImageryScore(css) {
    // Placeholder logic for imagery score based on the presence of background-image properties
    return (css.includes('background-image')) ? 10 : 8;
}

function calculateScore(category, data) {
    switch(category) {
        case "Color Scheme":
            return (calculateHarmonyScore(data.colors) + calculateContrastScore(data.colors)) / 2;
        case "Typography":
            return (calculateReadabilityScore(data.fonts) + calculateSuitabilityScore(data.fonts)) / 2;
        case "Layout and Spacing":
            return calculateLayoutScore(data.css);
        case "Design Principles":
            return calculateDesignPrinciplesScore(data.css);
        case "Imagery and Graphics":
            return calculateImageryScore(data.css);
        default:
            return 0;
    }
}


function calculateHarmonyScore(colors) {
    const uniqueColors = new Set(colors);
    const diversityScore = Math.min(uniqueColors.size, 5);  // Score out of 5 based on diversity of colors, but not too many
    const contrastScore = colors[0] !== colors[colors.length - 1] ? 5 : 3;  // Basic contrast check, score out of 5

    return (diversityScore + contrastScore) / 2;
}

function calculateReadabilityScore(fonts) {
    const webSafeFonts = ["Arial", "Helvetica", "Times New Roman", "Verdana", "Tahoma", "Georgia"];
    const scorePerFont = 10 / webSafeFonts.length;
    return fonts.reduce((score, font) => webSafeFonts.includes(font) ? score + scorePerFont : score, 0);
}

function calculateLayoutScore(cssData) {
    const layoutScore = cssData.includes("flex") || cssData.includes("grid") ? 8 : 5;  // Modern layout techniques
    const spacingScore = cssData.includes("margin") && cssData.includes("padding") ? 2 : 0;  // Consistent spacing

    return (layoutScore + spacingScore) / 2;
}

function calculateDesignPrinciplesScore(cssData) {
    const alignmentScore = cssData.includes("align") ? 3 : 0;
    const balanceScore = cssData.includes("margin: auto") ? 3 : 0;
    const hierarchyScore = cssData.includes("font-size") ? 4 : 0;

    return (alignmentScore + balanceScore + hierarchyScore) / 3;
}

function calculateImageryScore(imageData) {
    const svgScore = imageData.includes("svg") ? 5 : 0;  // Preference to SVGs
    const resolutionScore = imageData.includes("high-resolution") ? 5 : 3;  // Placeholder for high-resolution images

    return (svgScore + resolutionScore) / 2;
}


// Error handling middleware
app.use((err, req, res, next) => {
    winston.error(err.message, err);
    res.status(500).send({ error: "An unexpected error occurred. Please try again." });
});
