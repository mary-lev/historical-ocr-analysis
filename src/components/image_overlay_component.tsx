import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff } from 'lucide-react';
import { getSmartLineMatches, getFullDocumentAlignment } from '../utils/data_processing_utils';

const DocumentImageViewer = ({ 
  imageSrc, 
  altoData, 
  selectedLine = null, 
  onLineSelect = null,
  showOverlays = true 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(showOverlays);
  const imageRef = useRef(null);

  // Load and draw image with overlays
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Draw overlays if enabled and ALTO data available
      if (overlayVisible && altoData?.textLines) {
        drawTextLineOverlays(ctx, altoData.textLines);
      }
      
      setImageLoaded(true);
      imageRef.current = img;
    };

    img.src = imageSrc;
  }, [imageSrc, altoData, overlayVisible, selectedLine]);

  const drawTextLineOverlays = (ctx, textLines) => {
    textLines.forEach((line, index) => {
      const coords = line.coordinates;
      const isSelected = selectedLine === index;
      
      // Set style based on selection
      if (isSelected) {
        ctx.strokeStyle = '#3B82F6'; // Blue for selected
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#EF4444'; // Red for normal
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.lineWidth = 2;
      }
      
      // Draw rectangle
      ctx.fillRect(coords.hpos, coords.vpos, coords.width, coords.height);
      ctx.strokeRect(coords.hpos, coords.vpos, coords.width, coords.height);
      
      // Draw line number
      ctx.fillStyle = isSelected ? '#1E40AF' : '#991B1B';
      ctx.font = '16px Arial';
      ctx.fillText(
        `L${index + 1}`, 
        coords.hpos + 5, 
        coords.vpos + 20
      );
    });
  };

  const handleCanvasClick = (event) => {
    if (!onLineSelect || !altoData?.textLines) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position relative to canvas
    const x = (event.clientX - rect.left - offset.x) / scale;
    const y = (event.clientY - rect.top - offset.y) / scale;
    
    // Find which text line was clicked
    const clickedLineIndex = altoData.textLines.findIndex(line => {
      const coords = line.coordinates;
      return x >= coords.hpos && 
             x <= coords.hpos + coords.width &&
             y >= coords.vpos && 
             y <= coords.vpos + coords.height;
    });
    
    if (clickedLineIndex !== -1) {
      onLineSelect(clickedLineIndex);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (event) => {
    setIsDragging(true);
    setDragStart({
      x: event.clientX - offset.x,
      y: event.clientY - offset.y
    });
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;
    
    setOffset({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'document_with_overlays.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Reset View"
          >
            <RotateCcw size={20} />
          </button>
          <div className="text-sm text-gray-600 ml-2">
            Zoom: {Math.round(scale * 100)}%
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setOverlayVisible(!overlayVisible)}
            className={`p-2 rounded transition-colors ${
              overlayVisible 
                ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title={overlayVisible ? 'Hide Overlays' : 'Show Overlays'}
          >
            {overlayVisible ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Download Image"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden bg-gray-100"
        style={{ height: 'calc(100vh - 200px)', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">Loading image...</div>
          </div>
        )}
        
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute transition-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            cursor: onLineSelect ? 'pointer' : 'inherit'
          }}
        />
      </div>

      {/* Info Panel */}
      {altoData && (
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Lines:</span>
              <span className="ml-2 text-gray-600">{altoData.textLines?.length || 0}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Image Size:</span>
              <span className="ml-2 text-gray-600">
                {altoData.imageInfo?.width || 0} × {altoData.imageInfo?.height || 0}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Selected Line:</span>
              <span className="ml-2 text-gray-600">
                {selectedLine !== null ? `Line ${selectedLine + 1}` : 'None'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Overlays:</span>
              <span className="ml-2 text-gray-600">
                {overlayVisible ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>
          
          {selectedLine !== null && altoData.textLines?.[selectedLine] && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <div className="font-medium text-blue-900 mb-1">
                Selected Line {selectedLine + 1}:
              </div>
              <div className="text-blue-800 font-mono text-sm">
                "{altoData.textLines[selectedLine].text}"
              </div>
              <div className="text-blue-600 text-xs mt-1">
                Position: ({altoData.textLines[selectedLine].coordinates.hpos}, {altoData.textLines[selectedLine].coordinates.vpos}) 
                Size: {altoData.textLines[selectedLine].coordinates.width} × {altoData.textLines[selectedLine].coordinates.height}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Line extraction component for detailed analysis
const LineImageExtractor = ({ imageSrc, line, scale = 2 }) => {
  const canvasRef = useRef(null);
  const [extractedImage, setExtractedImage] = useState(null);

  useEffect(() => {
    if (!imageSrc || !line || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const coords = line.coordinates;
      const padding = 10; // Add padding around the line
      
      // Set canvas size with padding and scaling
      canvas.width = (coords.width + padding * 2) * scale;
      canvas.height = (coords.height + padding * 2) * scale;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw extracted line region with padding
      ctx.drawImage(
        img,
        coords.hpos - padding, coords.vpos - padding, // Source position
        coords.width + padding * 2, coords.height + padding * 2, // Source size
        0, 0, // Destination position
        canvas.width, canvas.height // Destination size (scaled)
      );
      
      setExtractedImage(canvas.toDataURL());
    };

    img.src = imageSrc;
  }, [imageSrc, line, scale]);

  if (!line) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h4 className="font-medium text-gray-700 mb-2">
        Extracted Line {line.id || 'Unknown'}
      </h4>
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded max-w-full h-auto"
      />
      <div className="mt-2 text-sm text-gray-600">
        Text: "{line.text}"
      </div>
    </div>
  );
};

// Complete document analysis component
const DocumentAnalysisView = ({ 
  documentData, 
  selectedModel = null,
  onModelSelect = null 
}) => {
  const [selectedLine, setSelectedLine] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'line-detail'
  const [selectedModels, setSelectedModels] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Memoize modelNames to prevent infinite loops
  const modelNames = useMemo(() => {
    return Object.keys(documentData?.jsonData?.ocr_models || documentData?.ocr_models || {});
  }, [documentData?.jsonData?.ocr_models, documentData?.ocr_models]);

  // Select first 2 models by default when modelNames changes
  useEffect(() => {
    if (modelNames.length > 0) {
      const defaultSelection = modelNames.slice(0, 2);
      setSelectedModels(prev => {
        if (prev.length !== defaultSelection.length || 
            !defaultSelection.every(model => prev.includes(model))) {
          return defaultSelection;
        }
        return prev;
      });
    } else {
      setSelectedModels(prev => prev.length > 0 ? [] : prev);
    }
  }, [modelNames]);

  const handleModelToggle = (modelName) => {
    setSelectedModels(prev => 
      prev.includes(modelName) 
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  // Auto-select first line when document loads
  React.useEffect(() => {
    if (documentData?.altoData?.textLines?.length > 0 && selectedLine === null) {
      setSelectedLine(0);
    }
  }, [documentData, selectedLine]);

  if (!documentData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-500">No document data available</div>
      </div>
    );
  }

  const selectedLineData = selectedLine !== null ? documentData.altoData.textLines[selectedLine] : null;
  const groundTruth = documentData.jsonData?.document_info?.ground_truth || documentData.groundTruth || documentData.document_info?.ground_truth;

  return (
    <div className="space-y-6">
      {/* Main Document Analysis */}
      <div className="flex gap-6 h-screen">
      {/* Left: Document Image Viewer - 50% */}
      <div className="w-1/2 min-w-0">
        <DocumentImageViewer
          imageSrc={documentData.imagePath}
          altoData={documentData.altoData}
          selectedLine={selectedLine}
          onLineSelect={setSelectedLine}
          showOverlays={true}
        />
      </div>

      {/* Right: Details Panel - 50% */}
      <div className="w-1/2 flex flex-col space-y-4">
        {/* Mode Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'overview'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('line-detail')}
            disabled={selectedLine === null}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'line-detail' && selectedLine !== null
                ? 'bg-blue-500 text-white'
                : selectedLine === null
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={selectedLine === null ? 'Select a line from the image to enable detailed view' : 'View detailed analysis of the selected line'}
          >
            Line Detail
          </button>
        </div>

        {/* Content based on mode */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {viewMode === 'overview' && (
            <div className="space-y-4">
              {/* Document Info */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Document Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ID:</strong> {documentData.documentId}</div>
                  <div><strong>Lines:</strong> {documentData.altoData.textLines?.length || 0}</div>
                  <div><strong>Image Size:</strong> {documentData.altoData.imageInfo?.width || 0} × {documentData.altoData.imageInfo?.height || 0}</div>
                  <div><strong>Ground Truth Length:</strong> {documentData.groundTruth?.length || 0} characters</div>
                </div>
              </div>

              {/* Selected Line Info */}
              {selectedLineData && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Selected Line Analysis</h3>
                  <div className="space-y-3">
                    <div>
                      <strong>Text:</strong> 
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded mt-1">
                        {selectedLineData.text}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><strong>Position:</strong> ({selectedLineData.coordinates.hpos}, {selectedLineData.coordinates.vpos})</div>
                      <div><strong>Size:</strong> {selectedLineData.coordinates.width} × {selectedLineData.coordinates.height}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Models Summary - Enhanced */}
              {documentData.jsonData?.ocr_models && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Model Performance Summary</h3>
                  <div className="space-y-3">
                    {Object.entries(documentData.jsonData.ocr_models).map(([modelName, modelData]) => (
                      <div key={modelName} className="border rounded-lg p-3 bg-gray-50">
                        <div className="font-medium text-sm mb-2 truncate" title={modelName}>
                          {modelName}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Character:</span>
                            <span className="font-medium text-blue-600">
                              {((modelData?.fullpage?.metrics?.character_accuracy || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Old Char:</span>
                            <span className="font-medium text-green-600">
                              {((modelData?.fullpage?.metrics?.old_char_preservation || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Case:</span>
                            <span className="font-medium text-purple-600">
                              {((modelData?.fullpage?.metrics?.case_accuracy || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Word:</span>
                            <span className="font-medium text-orange-600">
                              {((modelData?.fullpage?.metrics?.word_accuracy || 0) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">How to Use:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click on any highlighted text line in the image</li>
                  <li>• Switch to "Line Detail" mode for detailed comparison</li>
                  <li>• Use zoom controls to adjust image size</li>
                  <li>• Toggle overlays to show/hide text regions</li>
                </ul>
              </div>
            </div>
          )}

          {viewMode === 'line-detail' && selectedLineData && (
            <div className="space-y-4">
              {/* Line Context Info */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Line {selectedLine + 1} Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Position:</strong> ({selectedLineData.coordinates.hpos}, {selectedLineData.coordinates.vpos})</div>
                  <div><strong>Size:</strong> {selectedLineData.coordinates.width} × {selectedLineData.coordinates.height}</div>
                  <div><strong>Characters:</strong> {selectedLineData.text.length}</div>
                  <div><strong>Words:</strong> {selectedLineData.text.split(' ').length}</div>
                </div>
              </div>

              {/* Extracted Line Image */}
              <LineImageExtractor
                imageSrc={documentData.imagePath}
                line={selectedLineData}
                scale={3}
              />

              {/* Ground Truth */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-green-700 mb-2">Ground Truth:</h4>
                <div className="font-mono text-sm bg-green-50 p-3 rounded border">
                  {selectedLineData.text}
                </div>
              </div>

              {/* OCR Model Results - Enhanced with Smart Matching */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Model Comparisons:</h4>
                {documentData.jsonData?.ocr_models && (() => {
                  // Get smart line matches for the selected ground truth line
                  const groundTruthLine = selectedLineData.text;
                  const smartMatches = getSmartLineMatches(groundTruthLine, documentData.jsonData.ocr_models, 0.3);
                  
                  return Object.entries(documentData.jsonData.ocr_models).map(([modelName, modelData]) => {
                    const match = smartMatches[modelName];
                    const metrics = modelData?.fullpage?.metrics || {};
                    
                    return (
                      <div key={modelName} className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
                        match.isMatch ? 'border-green-400' : 'border-red-400'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <strong className={match.isMatch ? 'text-green-700' : 'text-red-700'}>
                            {modelName}
                          </strong>
                          <div className="flex space-x-3 text-xs">
                            <span className="text-blue-600">
                              Char: {(metrics.character_accuracy * 100).toFixed(1)}%
                            </span>
                            <span className="text-green-600">
                              Old: {(metrics.old_char_preservation * 100).toFixed(1)}%
                            </span>
                            <span className="text-purple-600">
                              Case: {(metrics.case_accuracy * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        
                        {/* Matched Text */}
                        <div className={`font-mono text-sm p-3 rounded border ${
                          match.isMatch ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          {match.isMatch ? 
                            match.matchedLine : 
                            '(No matching line found - model may have skipped this content)'
                          }
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* 3-Column Model Comparison */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">3-Column Model Comparison</h3>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showComparison
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showComparison ? 'Hide Comparison' : 'Show Comparison'}
            </button>
          </div>

          {showComparison && (
            <>
              {/* Model Selection */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Select Models to Compare:</h4>
                {modelNames.length === 0 ? (
                  <div className="text-gray-500 text-sm">No models found in document data</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {modelNames.map(model => (
                      <button
                        key={model}
                        onClick={() => handleModelToggle(model)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedModels.includes(model)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                <p className="text-sm text-blue-800">
                  Select up to 2 models for side-by-side comparison with ground truth. 
                  Lines are intelligently aligned even when models skip, rearrange, or modify content.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm font-medium text-blue-900">Currently comparing:</span>
                  {selectedModels.slice(0, 2).map(model => (
                    <span key={model} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-sm">
                      {model}
                    </span>
                  ))}
                  {selectedModels.length === 0 && (
                    <span className="text-xs text-blue-700 italic">Select models above</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3-Column Comparison Content */}
        {showComparison && selectedModels.length > 0 && (() => {
          const ocrModels = documentData.jsonData?.ocr_models || documentData.ocr_models || {};
          const documentAlignment = getFullDocumentAlignment(groundTruth, ocrModels, 0.3);
          const comparisonModels = selectedModels.slice(0, 2);
          
          return (
            <div className="overflow-hidden">
              {/* Header with model metrics */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-green-700">Ground Truth</h3>
                    <p className="text-xs text-gray-600">ALTO XML Reference</p>
                  </div>
                  {comparisonModels.map(modelName => {
                    const metrics = ocrModels[modelName]?.fullpage?.metrics || {};
                    return (
                      <div key={modelName}>
                        <h3 className="font-semibold text-blue-700 truncate" title={modelName}>
                          {modelName}
                        </h3>
                        <div className="flex space-x-3 text-xs">
                          <span className="text-blue-600">
                            Char: {(metrics.character_accuracy * 100).toFixed(1)}%
                          </span>
                          <span className="text-green-600">
                            Old: {(metrics.old_char_preservation * 100).toFixed(1)}%
                          </span>
                          <span className="text-purple-600">
                            Case: {(metrics.case_accuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3-Column Grid */}
              <div className="grid grid-cols-3 gap-0 max-h-96 overflow-y-auto">
                {/* Ground Truth Column */}
                <div className="border-r bg-green-50">
                  <div className="sticky top-0 bg-green-100 px-3 py-2 border-b font-semibold text-green-800 text-sm">
                    Ground Truth
                  </div>
                  <div className="p-3 space-y-1">
                    {documentAlignment.map((alignment, index) => (
                      <div key={index} className="font-mono text-xs leading-relaxed p-2 bg-white rounded border">
                        {alignment.groundTruthLine}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Columns */}
                {comparisonModels.map((modelName, modelIndex) => (
                  <div key={modelName} className={`${modelIndex === 0 ? 'border-r' : ''} bg-blue-50`}>
                    <div className="sticky top-0 bg-blue-100 px-3 py-2 border-b font-semibold text-blue-800 text-sm">
                      {modelName.split('-')[0]}
                    </div>
                    <div className="p-3 space-y-1">
                      {documentAlignment.map((alignment, index) => {
                        const modelMatch = alignment.modelMatches[modelName];
                        return (
                          <div key={index} className={`font-mono text-xs leading-relaxed p-2 rounded border ${
                            modelMatch.isMatch ? 'bg-white' : 'bg-red-50 border-red-200'
                          }`}>
                            {modelMatch.isMatch ? (
                              <div>{modelMatch.matchedLine}</div>
                            ) : (
                              <div className="text-red-600 italic text-xs">
                                (No match)
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export { DocumentImageViewer, LineImageExtractor, DocumentAnalysisView };