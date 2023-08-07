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
  // Removed redeclaration: const analyzeButton = document.getElementById('analyzeButton');
  // Removed redeclaration: // Removed redeclaration: const progressBar = document.getElementById('progressBar');
  // Removed redeclaration: const progress = document.getElementById('progress');
  // Removed redeclaration: const errorMessage = document.getElementById('errorMessage');
  
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
    // Removed redeclaration: const progressPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
    progress.style.width = `${progressPercentage}%`;
  });
  
  async 
  function displayResults(data) {
      // Extract data
      const { css, colors, fonts, categoryAnalysis, analysis } = data;
  
      // Display CSS
      document.getElementById('css-content').textContent = css;
  
      // Display colors
      const colorsContainer = document.getElementById('colors-container');
      colorsContainer.innerHTML = '';
      colors.forEach(color => {
          const colorElem = document.createElement('div');
          colorElem.className = 'color-box';
          colorElem.style.backgroundColor = color;
          colorsContainer.appendChild(colorElem);
      });
  
      // Display fonts
      const fontsContainer = document.getElementById('fonts-container');
      fontsContainer.innerHTML = '';
      fonts.forEach(font => {
          const fontElem = document.createElement('div');
          fontElem.className = 'font-box';
          fontElem.textContent = font;
          fontsContainer.appendChild(fontElem);
      });
  
      // Display analysis
      const analysisContainer = document.getElementById('analysis-container');
      analysisContainer.innerHTML = analysis;
  }
  
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
  
  
  // CSS Inspection
  document.body.addEventListener('mouseover', (event) => {
      const elementStyles = window.getComputedStyle(event.target);
      // TODO: Further processing or displaying of the styles
  });
  
  // CSS Analysis
  analyzeButton.addEventListener('click', async () => {
      // Capture the CSS or other data to send for analysis
      const cssData = '';  // TODO: Replace with actual CSS data or functionality
      try {
          const response = await fetch('/analyze', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ cssData })
          });
          const data = await response.json();
          
  // Extract the analysis results from the response and display them to the user
  const { description, scores } = data;
  analysisContent.innerHTML = description;
  // (Additional logic can be added here to display scores and other analysis details in the specified format)
  
          
          // Update the progress bar
          progress.style.width = "100%";
      } catch (error) {
          errorMessage.textContent = "Error analyzing the website. Please try again.";
      }
  });
  
  // TODO: Implement other client-side functionalities based on the placeholders and unfinished parts of the code
  
  
  // URL Submission and Analysis Initialization
  // Removed redeclaration: const websiteUrlInput = document.getElementById('websiteUrl');
  // Removed redeclaration: const analysisContent = document.getElementById('analysisContent');
  
  analyzeButton.addEventListener('click', async () => {
      const websiteUrl = websiteUrlInput.value;
      if (!websiteUrl) {
          errorMessage.textContent = "Please enter a valid URL.";
          return;
      }
      
      
  // Load the provided website in an iframe
  const iframe = document.createElement('iframe');
  iframe.src = websiteUrl;
  iframe.onload = async () => {
      const styles = [];
      // Iterate over all elements in the iframe and capture their computed styles
      const elements = iframe.contentDocument.querySelectorAll('*');
      elements.forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          styles.push(computedStyle.cssText);
      });
      // Send the captured CSS to the server for analysis
      const response = await fetch('/analyze', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cssData: styles.join('; ') })
      });
      if (!response.ok) {
          throw new Error("Failed to analyze the website.");
      }
      const data = await response.json();
      // Display the analysis results to the user
      analysisContent.innerHTML = data.description;
      // Update the progress bar to 100%
      progress.style.width = "100%";
  };
  document.body.appendChild(iframe);
  
      const cssData = '';  // TODO: Replace with actual CSS data or functionality
      
      try {
          // Send the captured CSS to the server for analysis
          const response = await fetch('/analyze', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ cssData })
          });
          
          if (!response.ok) {
              throw new Error("Failed to analyze the website.");
          }
          
          const data = await response.json();
          
          // Display the analysis results to the user
          analysisContent.innerHTML = data.description;
          
          // Update the progress bar to 100%
          progress.style.width = "100%";
          
      } catch (error) {
          errorMessage.textContent = error.message;
      }
  });
  
  
  // Helper function to create a new module for analysis results
  function createModule(title, content) {
      const module = document.createElement('div');
      module.className = 'module';
      const moduleTitle = document.createElement('h3');
      moduleTitle.textContent = title;
      const moduleContent = document.createElement('p');
      moduleContent.textContent = content;
      module.appendChild(moduleTitle);
      module.appendChild(moduleContent);
      return module;
  }
  
  // Function to display analysis results in animated modules
  function displayAnalysisInModules(analysis) {
      const analysisContainer = document.getElementById('analysisContainer');
      for (const [title, content] of Object.entries(analysis)) {
          const module = createModule(title, content);
          module.style.opacity = 0;  // Start invisible for fade-in animation
          analysisContainer.appendChild(module);
          // Fade-in animation
          setTimeout(() => {
              module.style.transition = 'opacity 1s';
              module.style.opacity = 1;
          }, 100);
      }
  }
  
  // Load the provided website in an iframe and capture its CSS
  const iframe = document.createElement('iframe');
  iframe.onload = async () => {
      const styles = [];
      const elements = iframe.contentDocument.querySelectorAll('*');
      elements.forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          styles.push(computedStyle.cssText);
      });
  
      const response = await fetch('/analyze', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cssData: styles.join('; ') })
      });
  
      if (!response.ok) {
          throw new Error("Failed to analyze the website.");
      }
  
      const data = await response.json();
      displayAnalysisInModules(data);
      progress.style.width = "100%";
  };
  document.body.appendChild(iframe);
  
  // Handling user interactions and triggering analysis
  // Removed redeclaration: const analyzeButton = document.getElementById('analyzeButton');
  // Removed redeclaration: const websiteUrlInput = document.getElementById('websiteUrl');
  // Removed redeclaration: const analysisContent = document.getElementById('analysisContent');
  // Removed redeclaration: const progress = document.getElementById('progressBar');
  
  analyzeButton.addEventListener('click', async () => {
      const websiteUrl = websiteUrlInput.value;
      iframe.src = websiteUrl;
  });
  
  
  // Analyze Function
  async function analyzeWebsite() {
      const websiteURL = document.getElementById('websiteURL').value;
      if (!websiteURL) {
          errorMessage.textContent = 'Please enter a valid website URL.';
          return;
      }
  
      // Initiate analysis for each module
      const modules = ['color_scheme', 'typography', 'layout_spacing', 'design_principles', 'imagery_graphics'];
      let progressStep = 100 / modules.length;
  
      for (let module of modules) {
          try {
              let response = await fetch('/analyze', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ url: websiteURL, module: module })
              });
              let data = await response.json();
              document.querySelector(`#${module} .module-result`).textContent = data.result;
              progressBar.style.width = `${progressBar.offsetWidth + progressStep}%`;
          } catch (error) {
              errorMessage.textContent = 'An error occurred during the analysis. Please try again.';
              return;
          }
      }
  }
  
  analyzeButton.addEventListener('click', analyzeWebsite);
  
  // Elements references
  // Removed redeclaration: const analyzeButton = document.getElementById('analyzeButton');
  // Removed redeclaration: const errorMessage = document.getElementById('error-message');
  // Removed redeclaration: // Removed redeclaration: const progressBar = document.getElementById('analysis-progress');
  const loader = document.getElementById('loader'); // Assuming there's a loader element
  
  // Disable/Enable button utility
  function toggleButtonState(button, state) {
      button.disabled = !state;
  }
  
  // Show/Hide loader utility
  function toggleLoader(state) {
      loader.style.display = state ? 'block' : 'none';
  }
  
  // Reset feedback UI
  function resetFeedbackUI() {
      errorMessage.textContent = '';
      progressBar.style.width = '0%';
  }
  
  async function analyzeWebsite() {
      const websiteURL = document.getElementById('websiteURL').value;
      if (!websiteURL) {
          errorMessage.textContent = 'Please enter a valid website URL.';
          return;
      }
      
      // Reset UI feedback and disable button
      resetFeedbackUI();
      toggleButtonState(analyzeButton, false);
      toggleLoader(true);
  
      const modules = ['color_scheme', 'typography', 'layout_spacing', 'design_principles', 'imagery_graphics'];
      let progressStep = 100 / modules.length;
  
      for (let module of modules) {
          try {
              let response = await fetch('/analyze', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ url: websiteURL, module: module })
              });
  
              if (!response.ok) {
                  throw new Error('Server responded with an error');
              }
  
              let data = await response.json();
              if (data.error) {
                  throw new Error(data.error);
              }
  
              document.querySelector(`#${module} .module-result`).textContent = data.result;
              progressBar.style.width = `${progressBar.offsetWidth + progressStep}%`;
  
          } catch (error) {
              errorMessage.textContent = error.message || 'An error occurred during the analysis. Please try again.';
              toggleLoader(false);
              toggleButtonState(analyzeButton, true);
              return;
          }
      }
  
      // Re-enable button and hide loader after analysis
      toggleButtonState(analyzeButton, true);
      toggleLoader(false);
  }
  
  analyzeButton.addEventListener('click', analyzeWebsite);
  
// Embed the analyzed webpage within an iframe
function embedAnalyzedWebpage(url) {
    const iframeContainer = document.getElementById('iframeContainer');
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = 'none';
    iframeContainer.appendChild(iframe);
}

// Display a loading spinner during the analysis
function displayLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.innerHTML = '<div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>';
    document.body.appendChild(spinner);
}

// Hide the loading spinner once analysis is complete
function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.remove();
    }
}

// Update the startAnalysis function to show and hide the spinner
function startAnalysis() {
    displayLoadingSpinner();
    // Rest of the analysis logic...
    // ...
    hideLoadingSpinner();  // Add this at the end of the analysis process
}
