# Historical OCR Analysis

A comprehensive web application for analyzing and visualizing OCR model performance on 18th century Russian Civil Font documents. This tool provides detailed insights into how modern Large Language Models handle historical text recognition challenges.

## Overview

This application supports the research paper "Why and Where LLMs Still Go Wrong: Gaps in Historical Linguistic Competence" by providing an interactive platform to explore OCR errors and model performance across a dataset of 1,029 historical Russian documents from 1752-1801.

## Features

### Analysis View (Dataset-Wide Insights)
- **Dataset Overview**: Comprehensive statistics covering 428 books, 28,662 text lines, and 933K characters
- **Historical Period Distribution**: Temporal analysis across decades with peak coverage in 1780s-1790s
- **Subject Distribution**: Analysis across fiction, science, religion, history, and other literary genres
- **Performance Metrics**: Model comparison table with top-3 highlighting across all evaluation metrics
- **Error Analysis**: Detailed breakdown of common errors, character substitutions, and foreign character insertions

### Document View (Individual Document Analysis)
- **Interactive Image Viewer**: Zoom, pan, and click-to-select text lines with ALTO XML overlay
- **Line-by-Line Analysis**: Detailed comparison of ground truth vs. model outputs
- **Smart Model Comparison**: 3-column layout with intelligent line matching algorithms
- **Performance Metrics**: Real-time accuracy metrics for character preservation, case sensitivity, and word accuracy

## Dataset

- **Scale**: 1,029 images from 428 books
- **Time Period**: 1752-1801 (18th century)
- **Language**: Russian Civil Font
- **Content**: Fiction, science, religion, history, geography, drama, education, poetry
- **OCR Difficulty**: Ranging from easy to hard, with majority classified as medium difficulty

## Models Evaluated

The application analyzes performance across 12 state-of-the-art language models:
- **OpenAI**: GPT-4.1, GPT-4o, O3, O4-mini
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.7 Sonnet
- **Meta**: Llama 4 Maverick, Llama 4 Scout
- **Alibaba**: Qwen 2.5 VL

## Key Research Findings

- **Historical Character Preservation**: Gemini models demonstrate superior preservation of historical Russian characters (ѣ, і, ъ) compared to other model families
- **Performance Hierarchy**: Latest generation models show 5-15% accuracy improvements over earlier versions
- **Common Error Patterns**: Case sensitivity and foreign character insertion remain primary challenges across all models
- **Dataset Complexity**: 880 medium difficulty and 146 hard documents provide significant OCR challenges

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Visualization**: Recharts for data visualization
- **Image Processing**: Canvas API for ALTO XML overlays
- **Data Processing**: Smart line matching algorithms for model comparison
- **Deployment**: GitHub Pages with automated CI/CD

## Installation and Development

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Setup
```bash
# Clone the repository
git clone https://github.com/mary-lev/historical-ocr-analysis.git
cd historical-ocr-analysis

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the application
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Data Structure

The application processes several data formats:
- **ALTO XML**: Ground truth text with coordinate information
- **JSON Metrics**: Per-document model performance data
- **Error Analysis**: Aggregated error patterns and statistics
- **Dataset Metadata**: Comprehensive dataset characteristics and difficulty classifications

## Usage

### Analyzing Overall Performance
1. Navigate to the **Analysis View**
2. Review dataset statistics in the **Overview** tab
3. Compare model rankings in the **Metrics** tab
4. Explore error patterns in the **Errors** tab

### Examining Specific Documents
1. Switch to **Document View**
2. Select a document from the dropdown menu
3. Interact with the document image to select text lines
4. Toggle the 3-column comparison to see detailed model outputs
5. Use line detail mode for character-level analysis

## Contributing

This project supports ongoing research in historical text recognition. Contributions are welcome for:
- Additional model evaluations
- Enhanced visualization features
- Performance optimizations
- Documentation improvements

## Citation

If you use this tool in your research, please cite:

```
[Paper citation to be added upon publication]
```

## License

MIT License - see LICENSE file for details.

## Contact

For questions about the research or technical implementation, please open an issue on GitHub.

---

**Live Application**: [https://mary-lev.github.io/historical-ocr-analysis](https://mary-lev.github.io/historical-ocr-analysis)