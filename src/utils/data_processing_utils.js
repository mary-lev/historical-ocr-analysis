// data-processing-utils.js
// Utilities for processing OCR analysis data

/**
 * Parse ALTO XML to extract text and coordinate information
 */
export const parseAltoXML = (xmlContent) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  const textLines = [];
  const lines = xmlDoc.querySelectorAll('TextLine');
  
  lines.forEach((line, index) => {
    const strings = line.querySelectorAll('String');
    const lineText = Array.from(strings).map(str => str.getAttribute('CONTENT')).join(' ');
    
    textLines.push({
      id: line.getAttribute('ID') || `line_${index}`,
      text: lineText,
      coordinates: {
        hpos: parseInt(line.getAttribute('HPOS')),
        vpos: parseInt(line.getAttribute('VPOS')),
        width: parseInt(line.getAttribute('WIDTH')),
        height: parseInt(line.getAttribute('HEIGHT'))
      },
      baseline: line.getAttribute('BASELINE')
    });
  });
  
  return {
    textLines,
    fullText: textLines.map(line => line.text).join('\n'),
    imageInfo: {
      width: parseInt(xmlDoc.querySelector('Page')?.getAttribute('WIDTH')),
      height: parseInt(xmlDoc.querySelector('Page')?.getAttribute('HEIGHT'))
    }
  };
};

/**
 * Load and process all data files for a document
 */
export const loadDocumentData = async (documentId) => {
  try {
    const basePath = import.meta.env.BASE_URL || './';
    
    // Load JSON file
    const jsonResponse = await fetch(`${basePath}data/json/${documentId}_ocr_results.json`);
    const jsonData = await jsonResponse.json();
    
    // Load ALTO XML file
    const xmlResponse = await fetch(`${basePath}data/xml/${documentId}.xml`);
    const xmlContent = await xmlResponse.text();
    const altoData = parseAltoXML(xmlContent);
    
    // Image path
    const imagePath = `${basePath}data/images/${documentId}.jpeg`;
    
    return {
      documentId,
      jsonData,
      altoData,
      imagePath,
      groundTruth: altoData.fullText
    };
  } catch (error) {
    console.error(`Error loading document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Advanced character-level diff with historical character awareness
 */
export const computeHistoricalDiff = (groundTruth, ocrText) => {
  const historicalChars = new Set(['ѣ', 'і', 'ъ', 'ѧ', 'ѡ', 'ꙋ', 'ѿ', 'ꙗ', 'ї']);
  const modernEquivalents = {
    'ѣ': 'е',
    'і': 'и',
    'ї': 'и'
  };
  
  const result = [];
  let i = 0, j = 0;
  
  while (i < groundTruth.length || j < ocrText.length) {
    const gtChar = groundTruth[i];
    const ocrChar = ocrText[j];
    
    if (gtChar === ocrChar) {
      result.push({
        char: gtChar,
        type: 'correct',
        isHistorical: historicalChars.has(gtChar)
      });
      i++; j++;
    } else if (!gtChar) {
      result.push({
        char: ocrChar,
        type: 'insertion',
        isHistorical: historicalChars.has(ocrChar),
        isOverHistoricization: historicalChars.has(ocrChar)
      });
      j++;
    } else if (!ocrChar) {
      result.push({
        char: gtChar,
        type: 'deletion',
        isHistorical: historicalChars.has(gtChar)
      });
      i++;
    } else {
      // Check for modernization
      const isModernization = modernEquivalents[gtChar] === ocrChar;
      
      result.push({
        char: ocrChar,
        type: 'substitution',
        originalChar: gtChar,
        isHistorical: historicalChars.has(gtChar) || historicalChars.has(ocrChar),
        isModernization,
        isOverHistoricization: !historicalChars.has(gtChar) && historicalChars.has(ocrChar)
      });
      i++; j++;
    }
  }
  
  return result;
};

/**
 * Analyze error patterns across all models
 */
export const analyzeErrorPatterns = (documentsData) => {
  const patterns = {
    byModel: {},
    byErrorType: {
      overHistoricization: [],
      modernization: [],
      caseErrors: [],
      visualConfusion: []
    },
    byCharacter: {}
  };
  
  documentsData.forEach(doc => {
    Object.entries(doc.jsonData.ocr_models).forEach(([modelName, modelData]) => {
      if (!patterns.byModel[modelName]) {
        patterns.byModel[modelName] = {
          totalErrors: 0,
          errorTypes: {
            overHistoricization: 0,
            modernization: 0,
            caseErrors: 0,
            visualConfusion: 0
          },
          accuracy: []
        };
      }
      
      const diff = computeHistoricalDiff(
        doc.groundTruth,
        modelData.fullpage.lines[0].extracted_text
      );
      
      diff.forEach(item => {
        if (item.type !== 'correct') {
          patterns.byModel[modelName].totalErrors++;
          
          if (item.isOverHistoricization) {
            patterns.byModel[modelName].errorTypes.overHistoricization++;
          }
          if (item.isModernization) {
            patterns.byModel[modelName].errorTypes.modernization++;
          }
        }
      });
      
      patterns.byModel[modelName].accuracy.push(
        modelData.fullpage.metrics.character_accuracy
      );
    });
  });
  
  return patterns;
};

/**
 * Generate line-by-line comparison data
 */
export const generateLineComparisons = (altoData, ocrResults) => {
  const comparisons = [];
  
  altoData.textLines.forEach((line, index) => {
    const lineComparison = {
      lineIndex: index,
      groundTruth: line.text,
      coordinates: line.coordinates,
      models: {}
    };
    
    Object.entries(ocrResults).forEach(([modelName, modelData]) => {
      // For simplicity, assuming full-page OCR. In reality, you'd need
      // to align lines or extract line-specific OCR results
      const fullText = modelData.fullpage.lines[0].extracted_text;
      const lines = fullText.split('\n');
      const ocrLine = lines[index] || '';
      
      lineComparison.models[modelName] = {
        text: ocrLine,
        diff: computeHistoricalDiff(line.text, ocrLine)
      };
    });
    
    comparisons.push(lineComparison);
  });
  
  return comparisons;
};

/**
 * Export analysis results for research
 */
export const exportResults = (analysisData, format = 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format) {
    case 'json':
      return {
        filename: `ocr_analysis_${timestamp}.json`,
        content: JSON.stringify(analysisData, null, 2),
        mimeType: 'application/json'
      };
      
    case 'csv':
      const csvData = generateCSVFromAnalysis(analysisData);
      return {
        filename: `ocr_analysis_${timestamp}.csv`,
        content: csvData,
        mimeType: 'text/csv'
      };
      
    case 'latex':
      const latexTable = generateLatexTable(analysisData);
      return {
        filename: `ocr_analysis_${timestamp}.tex`,
        content: latexTable,
        mimeType: 'text/plain'
      };
      
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

/**
 * Generate CSV for statistical analysis
 */
const generateCSVFromAnalysis = (analysisData) => {
  const headers = [
    'document_id',
    'model_name',
    'character_accuracy',
    'old_char_preservation',
    'case_accuracy',
    'word_accuracy',
    'over_historicization_errors',
    'modernization_errors',
    'case_errors'
  ];
  
  const rows = [];
  
  analysisData.forEach(doc => {
    Object.entries(doc.jsonData.ocr_models).forEach(([modelName, modelData]) => {
      const metrics = modelData.fullpage.metrics;
      const diff = computeHistoricalDiff(
        doc.groundTruth,
        modelData.fullpage.lines[0].extracted_text
      );
      
      const errorCounts = {
        overHistoricization: diff.filter(d => d.isOverHistoricization).length,
        modernization: diff.filter(d => d.isModernization).length,
        caseErrors: diff.filter(d => d.type === 'substitution' && 
          d.char?.toLowerCase() === d.originalChar?.toLowerCase()).length
      };
      
      rows.push([
        doc.documentId,
        modelName,
        metrics.character_accuracy,
        metrics.old_char_preservation,
        metrics.case_accuracy,
        metrics.word_accuracy,
        errorCounts.overHistoricization,
        errorCounts.modernization,
        errorCounts.caseErrors
      ]);
    });
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

/**
 * Generate LaTeX table for academic papers
 */
const generateLatexTable = (analysisData) => {
  const models = Object.keys(analysisData[0]?.jsonData.ocr_models || {});
  
  let latex = `\\begin{table}[ht]
\\centering
\\caption{OCR Performance on 18th Century Russian Civil Font}
\\label{tab:ocr_performance}
\\begin{tabular}{lcccc}
\\hline
Model & Character Accuracy & Old Char Preservation & Case Accuracy & Word Accuracy \\\\
\\hline
`;

  // Calculate averages across all documents
  models.forEach(modelName => {
    const accuracies = analysisData.map(doc => 
      doc.jsonData.ocr_models[modelName]?.fullpage.metrics
    ).filter(Boolean);
    
    const avg = {
      character_accuracy: accuracies.reduce((sum, m) => sum + m.character_accuracy, 0) / accuracies.length,
      old_char_preservation: accuracies.reduce((sum, m) => sum + m.old_char_preservation, 0) / accuracies.length,
      case_accuracy: accuracies.reduce((sum, m) => sum + m.case_accuracy, 0) / accuracies.length,
      word_accuracy: accuracies.reduce((sum, m) => sum + m.word_accuracy, 0) / accuracies.length
    };
    
    latex += `${modelName.replace(/_/g, '\\_')} & ${(avg.character_accuracy * 100).toFixed(1)}\\% & ${(avg.old_char_preservation * 100).toFixed(1)}\\% & ${(avg.case_accuracy * 100).toFixed(1)}\\% & ${(avg.word_accuracy * 100).toFixed(1)}\\% \\\\\n`;
  });

  latex += `\\hline
\\end{tabular}
\\end{table}`;

  return latex;
};

/**
 * Batch process all documents in a directory
 */
export const batchProcessDocuments = async (documentIds) => {
  const results = [];
  
  for (const docId of documentIds) {
    try {
      const data = await loadDocumentData(docId);
      results.push(data);
      console.log(`Processed document: ${docId}`);
    } catch (error) {
      console.error(`Failed to process document ${docId}:`, error);
    }
  }
  
  return results;
};

/**
 * Image overlay utilities for showing text regions
 */
export const createImageOverlay = (imageElement, textLines, scale = 1) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = imageElement.width * scale;
  canvas.height = imageElement.height * scale;
  
  // Draw the image
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
  
  // Draw text region overlays
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
  
  textLines.forEach(line => {
    const x = line.coordinates.hpos * scale;
    const y = line.coordinates.vpos * scale;
    const width = line.coordinates.width * scale;
    const height = line.coordinates.height * scale;
    
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
  });
  
  return canvas;
};

/**
 * Performance benchmarking utilities
 */
export const benchmarkModels = (analysisData) => {
  const benchmark = {
    overall: {},
    byErrorType: {},
    byCharacterType: {}
  };
  
  const models = Object.keys(analysisData[0]?.jsonData.ocr_models || {});
  
  models.forEach(modelName => {
    const modelResults = analysisData.map(doc => 
      doc.jsonData.ocr_models[modelName]?.fullpage.metrics
    ).filter(Boolean);
    
    benchmark.overall[modelName] = {
      mean_character_accuracy: modelResults.reduce((sum, m) => sum + m.character_accuracy, 0) / modelResults.length,
      std_character_accuracy: calculateStandardDeviation(modelResults.map(m => m.character_accuracy)),
      mean_old_char_preservation: modelResults.reduce((sum, m) => sum + m.old_char_preservation, 0) / modelResults.length,
      document_count: modelResults.length
    };
  });
  
  return benchmark;
};

const calculateStandardDeviation = (values) => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
};

/**
 * Calculate string similarity using multiple metrics
 */
export const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  // Normalize strings: trim whitespace, convert to lowercase
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // 1. Normalized Edit Distance (Levenshtein)
  const editDistance = calculateEditDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const editSimilarity = 1 - (editDistance / maxLength);
  
  // 2. Word overlap similarity
  const words1 = s1.split(/\s+/).filter(w => w.length > 0);
  const words2 = s2.split(/\s+/).filter(w => w.length > 0);
  const wordSimilarity = calculateWordOverlap(words1, words2);
  
  // 3. Character n-gram similarity (for handling OCR errors)
  const ngramSimilarity = calculateNgramSimilarity(s1, s2, 2);
  
  // Weighted combination of metrics
  return (editSimilarity * 0.4) + (wordSimilarity * 0.4) + (ngramSimilarity * 0.2);
};

/**
 * Calculate edit distance between two strings
 */
const calculateEditDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Calculate word overlap similarity
 */
const calculateWordOverlap = (words1, words2) => {
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size; // Jaccard similarity
};

/**
 * Calculate n-gram similarity
 */
const calculateNgramSimilarity = (str1, str2, n = 2) => {
  const getNgrams = (str, n) => {
    const ngrams = [];
    for (let i = 0; i <= str.length - n; i++) {
      ngrams.push(str.substr(i, n));
    }
    return ngrams;
  };
  
  const ngrams1 = getNgrams(str1, n);
  const ngrams2 = getNgrams(str2, n);
  
  if (ngrams1.length === 0 || ngrams2.length === 0) return 0;
  
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

/**
 * Find the best matching line for a ground truth line in model output
 */
export const findBestMatchingLine = (groundTruthLine, modelLines, threshold = 0.3) => {
  if (!groundTruthLine || !modelLines || modelLines.length === 0) {
    return { matchedLine: '', similarity: 0, lineIndex: -1, isMatch: false };
  }
  
  let bestMatch = { matchedLine: '', similarity: 0, lineIndex: -1, isMatch: false };
  
  modelLines.forEach((line, index) => {
    const similarity = calculateStringSimilarity(groundTruthLine, line);
    if (similarity > bestMatch.similarity) {
      bestMatch = {
        matchedLine: line,
        similarity,
        lineIndex: index,
        isMatch: similarity >= threshold
      };
    }
  });
  
  return bestMatch;
};

/**
 * Get smart line matches for all models
 */
export const getSmartLineMatches = (groundTruthLine, ocrModels, threshold = 0.3) => {
  const matches = {};
  
  Object.entries(ocrModels).forEach(([modelName, modelData]) => {
    const extractedText = modelData?.fullpage?.lines?.[0]?.extracted_text || '';
    const modelLines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    matches[modelName] = findBestMatchingLine(groundTruthLine, modelLines, threshold);
  });
  
  return matches;
};

/**
 * Get full document smart alignment between ground truth and all models
 */
export const getFullDocumentAlignment = (groundTruth, ocrModels, threshold = 0.3) => {
  const groundTruthLines = groundTruth.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const alignments = [];
  
  // Track which model lines have been used to avoid duplicate matches
  const usedModelLines = {};
  Object.keys(ocrModels).forEach(modelName => {
    usedModelLines[modelName] = new Set();
  });
  
  groundTruthLines.forEach((gtLine, gtIndex) => {
    const lineAlignment = {
      groundTruthLine: gtLine,
      groundTruthIndex: gtIndex,
      modelMatches: {}
    };
    
    // Find best matches for this ground truth line in each model
    Object.entries(ocrModels).forEach(([modelName, modelData]) => {
      const extractedText = modelData?.fullpage?.lines?.[0]?.extracted_text || '';
      const modelLines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Find best unused match
      let bestMatch = { matchedLine: '', similarity: 0, lineIndex: -1, isMatch: false };
      
      modelLines.forEach((line, index) => {
        if (!usedModelLines[modelName].has(index)) {
          const similarity = calculateStringSimilarity(gtLine, line);
          if (similarity > bestMatch.similarity) {
            bestMatch = {
              matchedLine: line,
              similarity,
              lineIndex: index,
              isMatch: similarity >= threshold
            };
          }
        }
      });
      
      // Mark this line as used if it's a good match
      if (bestMatch.isMatch) {
        usedModelLines[modelName].add(bestMatch.lineIndex);
      }
      
      lineAlignment.modelMatches[modelName] = bestMatch;
    });
    
    alignments.push(lineAlignment);
  });
  
  return alignments;
};