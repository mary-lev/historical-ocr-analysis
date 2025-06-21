# OCR Analysis Visualization Project Setup

## Project Structure

```
ocr-analysis-viz/
├── public/
│   ├── data/
│   │   ├── images/          # 98 document images (.jpeg)
│   │   ├── json/            # 98 OCR result files (.json)
│   │   └── xml/             # 98 ALTO XML ground truth files (.xml)
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── DocumentViewer.jsx       # Main document display
│   │   ├── ComparisonPanel.jsx      # Side-by-side OCR comparison
│   │   ├── MetricsRadar.jsx         # Radar chart for metrics
│   │   ├── MetricsTable.jsx         # Detailed metrics table
│   │   ├── ErrorAnalysis.jsx        # Error pattern analysis
│   │   ├── CharacterDiff.jsx        # Character-level diff display
│   │   ├── ImageOverlay.jsx         # Image with text region overlays
│   │   ├── DocumentBrowser.jsx      # Document grid/list view
│   │   └── ExportPanel.jsx          # Data export functionality
│   ├── utils/
│   │   ├── dataProcessing.js        # ALTO XML parsing, data loading
│   │   ├── diffAnalysis.js          # Character diff algorithms
│   │   ├── errorAnalysis.js         # Error pattern detection
│   │   ├── exportUtils.js           # CSV, LaTeX, JSON export
│   │   └── imageUtils.js            # Image overlay utilities
│   ├── hooks/
│   │   ├── useDocumentData.js       # Document loading hook
│   │   ├── useErrorAnalysis.js      # Error analysis hook
│   │   └── useExport.js             # Export functionality hook
│   ├── data/
│   │   └── sampleData.js            # Sample/mock data for development
│   ├── styles/
│   │   ├── globals.css              # Global styles
│   │   └── components.css           # Component-specific styles
│   ├── App.jsx                      # Main application component
│   └── main.jsx                     # Application entry point
├── scripts/
│   ├── processData.js               # Batch data processing scripts
│   ├── generateStats.js             # Statistical analysis scripts
│   └── validateData.js              # Data validation utilities
├── docs/
│   ├── API.md                       # Component API documentation
│   ├── DATA_FORMAT.md               # Data format specifications
│   └── USAGE.md                     # Usage instructions
├── package.json
├── vite.config.js                   # Vite configuration
├── tailwind.config.js               # Tailwind CSS configuration
└── README.md
```

## Quick Start

### 1. Initialize Project

```bash
# Create new React project
npm create vite@latest ocr-analysis-viz -- --template react
cd ocr-analysis-viz

# Install dependencies
npm install

# Install additional packages
npm install recharts d3 lucide-react papaparse
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configure Tailwind CSS

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles for historical text analysis */
.char-correct { @apply bg-green-100 text-green-800; }
.char-error { @apply bg-red-100 text-red-800; }
.char-historical { @apply bg-blue-100 text-blue-800 font-semibold; }
.char-modernized { @apply bg-yellow-100 text-yellow-800; }
.char-over-historical { @apply bg-purple-100 text-purple-800; }

.text-overlay {
  position: absolute;
  border: 2px solid rgba(255, 0, 0, 0.6);
  background: rgba(255, 0, 0, 0.1);
  pointer-events: none;
}
```

### 3. Set Up Data Structure

Create the data directory structure in `public/`:

```bash
mkdir -p public/data/{images,json,xml}
```

Copy your 98 files into respective directories:
- `834bac3679c1.jpeg` → `public/data/images/`
- `834bac3679c1.json` → `public/data/json/`
- `834bac3679c1.xml` → `public/data/xml/`

### 4. Create Data Index

```javascript
// public/data/index.json
{
  "documents": [
    "834bac3679c1",
    "document_id_2",
    "document_id_3",
    // ... all 98 document IDs
  ],
  "metadata": {
    "total_documents": 98,
    "date_range": "1750-1800",
    "font_type": "Civil Font",
    "language": "Russian"
  }
}
```

### 5. Implement Core Components

Use the provided `OCRAnalysisApp` component as your main application, and the `dataProcessing.js` utilities for data handling.

### 6. Development Workflow

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Advanced Features Implementation

### Real-time Document Processing

```javascript
// hooks/useDocumentData.js
import { useState, useEffect } from 'react';
import { loadDocumentData } from '../utils/dataProcessing';

export const useDocumentData = (documentId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId) return;
    
    setLoading(true);
    loadDocumentData(documentId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [documentId]);

  return { data, loading, error };
};
```

### Batch Analysis

```javascript
// scripts/batchAnalysis.js
import { batchProcessDocuments, analyzeErrorPatterns } from '../src/utils/dataProcessing.js';

const documentIds = [
  '834bac3679c1',
  // ... all document IDs
];

async function runBatchAnalysis() {
  console.log('Starting batch analysis...');
  
  const documents = await batchProcessDocuments(documentIds);
  const patterns = analyzeErrorPatterns(documents);
  
  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    documentCount: documents.length,
    patterns,
    summary: generateSummary(patterns)
  };
  
  console.log('Analysis complete:', results.summary);
  return results;
}

runBatchAnalysis().catch(console.error);
```

### Export Functionality

```javascript
// components/ExportPanel.jsx
import React from 'react';
import { exportResults } from '../utils/exportUtils';

const ExportPanel = ({ analysisData }) => {
  const handleExport = (format) => {
    const exported = exportResults(analysisData, format);
    
    const blob = new Blob([exported.content], { type: exported.mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-panel">
      <h3>Export Results</h3>
      <div className="export-buttons">
        <button onClick={() => handleExport('json')}>
          Export JSON
        </button>
        <button onClick={() => handleExport('csv')}>
          Export CSV
        </button>
        <button onClick={() => handleExport('latex')}>
          Export LaTeX Table
        </button>
      </div>
    </div>
  );
};
```

## Performance Optimization

### Lazy Loading Images

```javascript
// components/LazyImage.jsx
import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {loaded ? (
        <img src={src} alt={alt} className="w-full h-auto" />
      ) : (
        <div className="bg-gray-200 animate-pulse w-full h-64 flex items-center justify-center">
          Loading...
        </div>
      )}
    </div>
  );
};
```

### Virtual Scrolling for Large Lists

```javascript
// components/VirtualDocumentList.jsx
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

const VirtualDocumentList = ({ documents, onSelectDocument }) => {
  const ItemRenderer = ({ index, style }) => {
    const doc = documents[index];
    return (
      <div style={style} className="p-2 border-b">
        <DocumentCard 
          document={doc} 
          onClick={() => onSelectDocument(doc.id)} 
        />
      </div>
    );
  };

  return (
    <List
      height={600}
      itemCount={documents.length}
      itemSize={120}
      width="100%"
    >
      {ItemRenderer}
    </List>
  );
};
```

## Research Integration

### Statistical Analysis

```javascript
// utils/statisticalAnalysis.js
export const calculateSignificance = (model1Results, model2Results) => {
  // Implementation of statistical tests for comparing model performance
  // Paired t-test, Mann-Whitney U test, etc.
};

export const generateCorrelationMatrix = (metrics) => {
  // Calculate correlations between different accuracy metrics
};

export const performRegression = (independentVars, dependentVar) => {
  // Linear regression to identify factors affecting accuracy
};
```

### Publication-Ready Figures

```javascript
// components/PublicationFigures.jsx
export const generateFigure1 = (data) => {
  // Model performance comparison chart
};

export const generateFigure2 = (data) => {
  // Error type distribution by model family
};

export const generateTable1 = (data) => {
  // Comprehensive accuracy metrics table
};
```

## Deployment

### GitHub Pages Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Usage Examples

### Basic Analysis

```javascript
// Example usage in research context
import { OCRAnalysisApp } from './src/App';

// Initialize with your document set
const documentIds = ['834bac3679c1', /* ... other IDs */];

// Run the analysis
const app = new OCRAnalysisApp({
  documentIds,
  analysisTypes: ['accuracy', 'historical_preservation', 'error_patterns'],
  exportFormats: ['csv', 'latex']
});
```

### Custom Analysis

```javascript
// Custom analysis for specific research questions
const customAnalysis = {
  // Focus on specific model families
  modelGroups: {
    'OpenAI': ['gpt-4o', 'gpt-4.1'],
    'Google': ['gemini-2.5-flash', 'gemini-2.0-flash'],
    'Anthropic': ['claude-3-5-sonnet', 'claude-sonnet-4']
  },
  
  // Specific metrics of interest
  focusMetrics: ['old_char_preservation', 'over_historicization_rate'],
  
  // Historical character analysis
  targetCharacters: ['ѣ', 'і', 'ъ']
};
```

This setup provides a comprehensive foundation for your OCR analysis visualization project, supporting both interactive exploration and automated research workflows.