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

async function analyzeWebsite() {
    // Show loading spinner and progress bar
    analyzeButton.innerText = 'Loading...';
    analyzeButton.disabled = true;
    progressBar.style.visibility = 'visible';
    errorMessage.style.display = 'none';  // Hide any previous error messages

    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value;

    // Validate URL
    try {
        new URL(url);
    } catch (_) {
        console.error('Invalid URL:', url);
        errorMessage.innerText = 'Invalid URL.';
        errorMessage.style.display = 'block';
        resetAnalyzerUI();
        return;
    }

    // Send request to server for analysis
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const data = await response.json();

        if (response.ok) {
            // Display analysis in a preliminary manner (will refine this later)
            const resultsContainer = document.getElementById('resultsContainer');
            resultsContainer.innerHTML = data.analysis;
        } else {
            console.error('Error from server:', data.error);
            errorMessage.innerText = data.error;
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error analyzing website:', error);
        errorMessage.innerText = 'Error analyzing website.';
        errorMessage.style.display = 'block';
    }

    // Reset the UI
    resetAnalyzerUI();
}

function resetAnalyzerUI() {
    analyzeButton.innerText = 'Analyze';
    analyzeButton.disabled = false;
    progressBar.style.visibility = 'hidden';
}

// Handle the server's analysis response and populate the modular squares
function displayAnalysis(analysis) {
    // For demonstration purposes, we'll split the analysis into sections
    // This is a placeholder approach; a more refined categorization should be based on the actual analysis structure
    const analysisSections = analysis.split('-----');  // Assuming '-----' as a delimiter for sections

    // Populate the modular squares
    document.getElementById('colorSchemeResult').innerText = analysisSections[0] || 'Analysis not available';
    document.getElementById('typographyResult').innerText = analysisSections[1] || 'Analysis not available';
    document.getElementById('layoutResult').innerText = analysisSections[2] || 'Analysis not available';
    document.getElementById('designPrinciplesResult').innerText = analysisSections[3] || 'Analysis not available';
    document.getElementById('imageryResult').innerText = analysisSections[4] || 'Analysis not available';

    // Trigger animations for the squares
    animateSquares();
}

// Animate the modular squares with a fade-in-up effect
function animateSquares() {
    const squares = document.querySelectorAll('.result-square');
    squares.forEach((square, index) => {
        setTimeout(() => {
            square.style.transform = 'translateY(0)';
            square.style.opacity = '1';
        }, index * 200);  // Staggered animation delay for each square
    });
}

// Update the analyzeWebsite function to handle the server's response
// ... [Rest of the analyzeWebsite function remains unchanged] ...
if (response.ok) {
    // Display analysis using the new function
    displayAnalysis(data.analysis);
} else {
    // ... [Error handling remains unchanged] ...
}
// ... [Rest of the analyzeWebsite function remains unchanged] ...

// Refining the display for the "Color Scheme" category
function displayColorSchemeResults(analysisSection) {
    const colorSchemeResult = document.getElementById('colorSchemeResult');
    
    // Extract relevant details from the analysis section
    // For demonstration, we're assuming certain keywords or patterns (this should be refined based on actual analysis structure)
    const primaryColor = analysisSection.match(/primary color #([a-fA-F0-9]{6})/)?.[1];
    const accentColor = analysisSection.match(/accent color #([a-fA-F0-9]{6})/)?.[1];
    
    // Construct the display content
    let content = '';
    if (primaryColor) {
        content += `<p><strong>Primary Color:</strong> <span style="background-color: #${primaryColor};">#${primaryColor}</span></p>`;
    }
    if (accentColor) {
        content += `<p><strong>Accent Color:</strong> <span style="background-color: #${accentColor};">#${accentColor}</span></p>`;
    }
    
    colorSchemeResult.innerHTML = content;
}

// Update the displayAnalysis function to handle the refined display for the "Color Scheme" category
function displayAnalysis(analysis) {
    // Split the analysis into sections
    const analysisSections = analysis.split('-----');  // Assuming '-----' as a delimiter for sections

    // Display the refined results for the "Color Scheme" category
    displayColorSchemeResults(analysisSections[0]);
    
    // ... [Rest of the displayAnalysis function remains unchanged] ...
}

// Refining the display for the "Typography" category
function displayTypographyResults(analysisSection) {
    const typographyResult = document.getElementById('typographyResult');
    
    // Extract relevant details from the analysis section
    // For demonstration, we're assuming certain keywords or patterns (this should be refined based on actual analysis structure)
    const bodyFont = analysisSection.match(/body text is '(.*?)'/)?.[1];
    const headerFont = analysisSection.match(/headers use '(.*?)'/)?.[1];
    const bodyFontSize = analysisSection.match(/body text size of (\d+px)/)?.[1];
    const headerFontSize = analysisSection.match(/header font size of (\d+px)/)?.[1];
    
    // Construct the display content
    let content = '<h3>Font Choices:</h3>';
    if (bodyFont) {
        content += `<p><strong>Body Text:</strong> ${bodyFont}</p>`;
    }
    if (headerFont) {
        content += `<p><strong>Headers:</strong> ${headerFont}</p>`;
    }
    content += '<h3>Readability:</h3>';
    if (bodyFontSize) {
        content += `<p><strong>Body Text Size:</strong> ${bodyFontSize}</p>`;
    }
    if (headerFontSize) {
        content += `<p><strong>Header Size:</strong> ${headerFontSize}</p>`;
    }
    
    typographyResult.innerHTML = content;
}

// Update the displayAnalysis function to handle the refined display for the "Typography" category
function displayAnalysis(analysis) {
    // Split the analysis into sections
    const analysisSections = analysis.split('-----');  // Assuming '-----' as a delimiter for sections

    // Display the refined results for the "Typography" category
    displayTypographyResults(analysisSections[1]);
    
    // ... [Rest of the displayAnalysis function remains unchanged] ...
}

// Refining the display for the "Layout and Spacing" category
function displayLayoutResults(analysisSection) {
    const layoutResult = document.getElementById('layoutResult');
    
    // Extract and display relevant details from the analysis section
    // For demonstration, using basic placeholders (should be refined based on actual analysis structure)
    layoutResult.innerHTML = `<p>${analysisSection}</p>`;
}

// Refining the display for the "Design Principles" category
function displayDesignPrinciplesResults(analysisSection) {
    const designPrinciplesResult = document.getElementById('designPrinciplesResult');
    
    // Extract and display relevant details from the analysis section
    // For demonstration, using basic placeholders (should be refined based on actual analysis structure)
    designPrinciplesResult.innerHTML = `<p>${analysisSection}</p>`;
}

// Refining the display for the "Imagery and Graphics" category
function displayImageryResults(analysisSection) {
    const imageryResult = document.getElementById('imageryResult');
    
    // Extract and display relevant details from the analysis section
    // For demonstration, using basic placeholders (should be refined based on actual analysis structure)
    imageryResult.innerHTML = `<p>${analysisSection}</p>`;
}

// Update the displayAnalysis function to handle the refined display for all categories
function displayAnalysis(analysis) {
    // Split the analysis into sections
    const analysisSections = analysis.split('-----');  // Assuming '-----' as a delimiter for sections

    // Display the refined results for all categories
    displayColorSchemeResults(analysisSections[0]);
    displayTypographyResults(analysisSections[1]);
    displayLayoutResults(analysisSections[2]);
    displayDesignPrinciplesResults(analysisSections[3]);
    displayImageryResults(analysisSections[4]);
}
