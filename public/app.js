// SWUP
const swup = new Swup({
  plugins: [new SwupScrollPlugin()]
});

// Navigation
const header = document.querySelector('#header');
const navItems = document.querySelectorAll('.nav-item');

// Toggle active nav item
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// Scrolling Effect
let lastScrollPosition = 0;
window.addEventListener('scroll', () => {
  let currentScrollPosition = window.pageYOffset;
  if (currentScrollPosition > lastScrollPosition) {
    header.style.transform = 'translateY(-200px)';
  } else {
    header.style.transform = 'translateY(0)';
  }
  lastScrollPosition = currentScrollPosition;
});

// Analyzer
const analyzeButton = document.getElementById('analyzeButton');
const progressBar = document.getElementById('progressBar');
const errorMessage = document.getElementById('errorMessage');

analyzeButton.addEventListener('click', analyzeWebsite);

async function analyzeWebsite() {
  // Show loading spinner
  analyzeButton.innerText = 'Loading...';
  analyzeButton.disabled = true;

  // Show progress bar
  progressBar.style.visibility = 'visible';

  const urlInput = document.getElementById('urlInput');
  const url = urlInput.value;

  // Validate URL
  try {
    new URL(url);
  } catch (_) {
    handleError({ message: 'Invalid URL.' });
    // Reset button and progress bar
    resetAnalyzer();
    return;
  }

  // Extract CSS analysis and other data
  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('An error occurred while analyzing the website.');
    }

    const data = await response.json();
    displayAnalysisResults(data.description);

    const extractedData = extractColorsAndFonts(data.css);
    displayColors(extractedData.colors);
    provideSuggestions(extractedData);

    const score = calculateDesignScore(extractedData);
    updateProgressBar(score);

  } catch (error) {
    handleError(error);
  }

  // Reset button and progress bar
  resetAnalyzer();
}

function resetAnalyzer() {
  analyzeButton.innerText = 'Analyze';
  analyzeButton.disabled = false;
  progressBar.style.visibility = 'hidden';
}

function handleError(error) {
  const errorContainer = document.querySelector('.error-message');
  errorContainer.textContent = error.message || 'An unexpected error occurred.';
}

function extractColorsAndFonts(cssData) {
  const colorRegex = /color:\s*(#[0-9a-fA-F]{6}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*\d+\.?\d*\s*)?\))/g;
  const bgColorRegex = /background-color:\s*(#[0-9a-fA-F]{6}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*\d+\.?\d*\s*)?\))/g;
  const fontRegex = /font-family:\s*([^;]+);/g;
  const fontSizeRegex = /font-size:\s*([^;]+);/g;

  const colors = [...cssData.matchAll(colorRegex)].map(match => match[1]);
  const bgColors = [...cssData.matchAll(bgColorRegex)].map(match => match[1]);
  const fonts = [...cssData.matchAll(fontRegex)].map(match => match[1]);
  const fontSizes = [...cssData.matchAll(fontSizeRegex)].map(match => match[1]);

  return {
    colors: [...new Set(colors.concat(bgColors))], // Unique colors
    fonts: [...new Set(fonts)],
    fontSizes: [...new Set(fontSizes)]
  };
}

function displayColors(colors) {
  const colorContainer = document.querySelector('.color-palette');
  colorContainer.innerHTML = ''; // Clear previous colors
  colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.classList.add('color-swatch');
    swatch.style.backgroundColor = color;
    colorContainer.appendChild(swatch);
  });
}

function displayAnalysisResults(description) {
  const resultsContainer = document.querySelector('.analysis-results');
  resultsContainer.innerHTML = ''; // Clear previous results
  const resultElem = document.createElement('p');
  resultElem.textContent = description;
  resultsContainer.appendChild(resultElem);
}

function calculateDesignScore(data) {
  const colorScore = Math.min(data.colors.length * 2, 10); // Max score of 10
  const fontScore = Math.min(data.fonts.length * 3, 10); // Max score of 10
  const fontSizeScore = Math.min(data.fontSizes.length, 10); // Max score of 10

  return (colorScore + fontScore + fontSizeScore) / 3; // Average score
}

function updateProgressBar(percentage) {
  const progressBarInner = document.querySelector('.progress-bar-inner');
  progressBarInner.style.width = `${percentage}%`;
}

const suggestions = {
  colors: 'Consider using a more varied color palette.',
  fonts: 'Try using different fonts for headings and content.',
};

function provideSuggestions(data) {
  const suggestionsContainer = document.querySelector('.suggestions');
  suggestionsContainer.innerHTML = ''; // Clear previous suggestions
  if (data.colors.length < 3) {
    displaySuggestion(suggestions.colors);
  }
  if (data.fonts.length < 2) {
    displaySuggestion(suggestions.fonts);
  }
}

function displaySuggestion(message) {
  const suggestionsContainer = document.querySelector('.suggestions');
  const suggestionElem = document.createElement('p');
  suggestionElem.textContent = message;
  suggestionsContainer.appendChild(suggestionElem);
}
