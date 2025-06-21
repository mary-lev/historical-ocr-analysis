# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an OCR (Optical Character Recognition) error analysis and visualization tool for 18th century Russian Civil Font documents. The project analyzes and compares the performance of different LLM models (Claude, GPT, Gemini, Llama) on historical Russian text OCR tasks, with particular focus on historical character preservation and error pattern analysis.

## Data Structure

The project uses a dataset of 98 historical Russian documents (1750-1800) with:
- `images/`: Original document images (.jpeg format)  
- `json/`: OCR analysis results with model comparisons and metrics (.json format)
- `xml/`: ALTO XML ground truth files with text coordinates (.xml format)

Each document follows the naming pattern: `{document_id}.{extension}` (e.g., `024d35035e81.jpeg`)

## Core Components

### Main Analysis Tool (`ocr_analysis_tool.tsx`)
- React application for interactive OCR analysis
- Provides tabbed interface for comparison, metrics, and error analysis
- Uses Recharts for data visualization (radar charts, bar charts)
- Includes character-level diff visualization with historical character awareness

### Image Overlay Component (`image_overlay_component.tsx`)
- Canvas-based document image viewer with zoom/pan functionality
- Overlays text region bounding boxes from ALTO XML data
- Interactive line selection for detailed analysis
- Supports image download with overlays

### Data Processing Utilities (`data_processing_utils.js`)
- ALTO XML parsing for extracting text coordinates and ground truth
- Historical character-aware diff algorithms
- Error pattern analysis (over-historicization, modernization, case errors)
- Export functionality for CSV, JSON, and LaTeX formats
- Batch document processing capabilities

## Key Features

### Historical Character Analysis
The system specifically tracks historical Russian characters:
- `ѣ` (yat), `і` (dotted i), `ъ` (hard sign), `ѧ`, `ѡ`, `ꙋ`, `ѿ`, `ꙗ`, `ї`
- Detects modernization errors (e.g., `і` → `и`, `ѣ` → `е`)
- Identifies over-historicization (adding archaic characters not in original)

### Error Categories
- **Over-historicization**: Adding archaic characters not present in ground truth
- **Modernization**: Converting historical characters to modern equivalents
- **Case errors**: Incorrect capitalization
- **Visual confusion**: Character shape misidentification

### Metrics Tracked
- Character accuracy
- Old character preservation rate
- Case accuracy  
- Word accuracy

## Technology Stack

The project is designed as a React/Vite application with:
- React with hooks for state management
- Recharts for data visualization
- Tailwind CSS for styling
- Canvas API for image manipulation
- Native JavaScript for data processing

## Development Commands

This is a Vite-based React project. Use these commands:
- `npm install` - Install dependencies
- `npm run dev` - Start development server (runs on http://localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality checks

## Usage Patterns

### Loading Document Data
Use `loadDocumentData(documentId)` to load all files for a document (JSON, XML, image)

### Analyzing Errors
Use `computeHistoricalDiff(groundTruth, ocrText)` for character-level comparison with historical awareness

### Batch Processing
Use `batchProcessDocuments(documentIds)` to process multiple documents

### Exporting Results
Use `exportResults(analysisData, format)` to export in JSON, CSV, or LaTeX format

## Research Context

This tool supports academic research on "Why and Where LLMs Still Go Wrong: Gaps in Historical Linguistic Competence" - analyzing how modern language models handle historical text variants and archaic character forms in Russian Civil Font documents from 1750-1800.