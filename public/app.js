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
const progress = document.getElementById('progress');
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
    console.error('Invalid URL:', url);
    errorMessage.innerText = 'Invalid URL.';
    errorMessage.style.display = 'block';
    // Reset button and progress bar
    analyzeButton.innerText = 'Analyze';
    analyzeButton.disabled = false;
    progressBar.style.visibility = 'hidden';
    return;
  }

  // Send request to server
  try {
    const response = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.error('Server response was not ok:', response);
      errorMessage.innerText = 'An error occurred while analyzing the website.';
      errorMessage.style.display = 'block';
      // Reset button and progress bar
      analyzeButton.innerText = 'Analyze';
      analyzeButton.disabled = false;
      progressBar.style.visibility = 'hidden';
      return;
    }

    const data = await response.json();

    if (!data || !data.css || !data.colors || !data.fonts || !data.categoryAnalysis || !data.analysis) {
      console.error('Response data is undefined or missing required fields:', data);
      errorMessage.innerText = 'An error occurred while analyzing the website.';
      errorMessage.style.display = 'block';
      // Reset button and progress bar
      analyzeButton.innerText = 'Analyze';
      analyzeButton.disabled = false;
      progressBar.style.visibility = 'hidden';
      return;
    }

    // Hide progress bar
    progressBar.style.visibility = 'hidden';

    // Hide loading
    analyzeButton.innerText = 'Analyze';
    analyzeButton.disabled = false;

    // Redirect to results page
    window.location.href = '#results';

    // Show results
    setTimeout(function(){ displayResults(data); }, 1000);
  } catch (error) {
    console.error('An error occurred while analyzing the website:', error);
    errorMessage.innerText = 'An error occurred while analyzing the website.';
    errorMessage.style.display = 'block';
    // Reset button and progress bar
    analyzeButton.innerText = 'Analyze';
    analyzeButton.disabled = false;
    progressBar.style.visibility = 'hidden';
  }
}

// Update progress bar based on scroll position
window.addEventListener('scroll', () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const progressPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
  progress.style.width = `${progressPercentage}%`;
});

async function displayResults(data) {
  const { css, colors, fonts, categoryAnalysis, analysis } = data;
  const analysisDiv = document.getElementById('analysis');
  analysisDiv.innerHTML = '';

  // Create modules for each category of analysis
  const categories = ["Color Scheme", "Typography", "Layout and Spacing", "Design Principles", "Imagery and Graphics"];
  for (let category of categories) {
    const contentData = categoryAnalysis[category.toLowerCase()];
    const module = createModule(category, contentData);
    analysisDiv.appendChild(module);
  }

  // Add CSS, colors, and fonts to the analysis
  const cssDiv = document.createElement('div');
  cssDiv.innerHTML = `<h3>CSS</h3><pre>${css}</pre>`;
  analysisDiv.appendChild(cssDiv);

  const colorsDiv = document.createElement('div');
  colorsDiv.innerHTML = `<h3>Colors</h3><ul>${colors.map(color => `<li>${color}</li>`).join('')}</ul>`;
  analysisDiv.appendChild(colorsDiv);

  const fontsDiv = document.createElement('div');
  fontsDiv.innerHTML = `<h3>Fonts</h3><ul>${fonts.map(font => `<li>${font}</li>`).join('')}</ul>`;
  analysisDiv.appendChild(fontsDiv);
}

function createModule(category, contentData) {
  const moduleDiv = document.createElement('div');
  moduleDiv.classList.add('module', 'fade-in');

  const categoryTitle = document.createElement('h3');
  categoryTitle.textContent = category;

  const categoryContent = document.createElement('div');
  if (contentData && contentData.analysis) {
    const analysisElement = document.createElement('p');
    analysisElement.textContent = contentData.analysis;
    categoryContent.appendChild(analysisElement);

    if (contentData.score !== undefined) {
      const scoreElement = document.createElement('p');
      scoreElement.classList.add('score');
      scoreElement.textContent = `Score: ${contentData.score}/10`;
      categoryContent.appendChild(scoreElement);
    } else {
      const noScoreElement = document.createElement('p');
      noScoreElement.classList.add('score');
      noScoreElement.textContent = 'Score: N/A';
      categoryContent.appendChild(noScoreElement);
    }
  } else {
    const noDataMessage = document.createElement('p');
    noDataMessage.textContent = 'No data available for this category.';
    categoryContent.appendChild(noDataMessage);
  }

  moduleDiv.appendChild(categoryTitle);
  moduleDiv.appendChild(categoryContent);

  return moduleDiv;
}
