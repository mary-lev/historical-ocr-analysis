import React, { useState, useEffect } from 'react';
import OCRAnalysisApp from './components/ocr_analysis_tool';
import { DocumentAnalysisView } from './components/image_overlay_component';
import { loadDocumentData, batchProcessDocuments } from './utils/data_processing_utils';
import './styles/globals.css';

// Document IDs based on the available files
const DOCUMENT_IDS = [
  '024d35035e81', '04b1382c18da', '05a795bb4e3d', '0a01cda14c9e', '0aefed141cd6',
  '0d1b1aaf40cb', '0e2a73f13785', '0f82839b83f1', '12770ad3f769', '138f1cb78238',
  '1c6c55a222a7', '2035f3aaa268', '20bc56d3d852', '22bac8a7051b', '245cf90464e3',
  '267889351c5d', '2849e78d34f5', '2b4ca480c299', '2b9f62e32be5', '2cea3615753b',
  '2ee4397d7256', '305283f45e2c', '338983236ec7', '34875746880a', '359508f50e6f',
  '38614bed34bd', '41f0b7bc8fba', '47a6fe0fae17', '47cbf95860b6', '4892664c3e11',
  '4ae2e60e2f5e', '4b369dc6f692', '4b78ef0a9f32', '5068d9e1245a', '526e4142244a',
  '57555a39635e', '5b0818803062', '5cfd22e9932b', '5e1d7749689e', '5ec08b2c4166',
  '60f7351dcc25', '66fe68d2242e', '6d60377be9b0', '6db985d4b616', '7d9381fc745f',
  '8093e74a27c4', '826f2959098a', '829aa4442076', '834bac3679c1', '8a029cf09c5f',
  '9104efa3deb3', '92623f14e7b4', '9288d6e1fd49', '932eb842fb2d', '954405f4fa87',
  '9607954e7673', '98a3e20877a4', '9c6d56762681', '9cfe907a361c', 'a6d4b025dfaf',
  'a9b9a50769e2', 'ac61b6bc1421', 'acb5811852ce', 'aecd60ab9a9c', 'b2ee0661fa40',
  'b8aa76c6892d', 'bd86ef6f4a33', 'bdb12c0f6005', 'be32d178c3d5', 'befa04fc6bd2',
  'c12d8c5ee80c', 'c19b2d386b63', 'c2aa91800a83', 'c4a5aaf77714', 'c7188524546c',
  'c744d9029bcd', 'c8815380c206', 'cb950fddd7a3', 'ce25cc51f300', 'd31a5eb7057b',
  'd5181a5b93fb', 'da79ce4985b1', 'db64b71d6e35', 'df85785ad559', 'e063d9889f80',
  'e0ecd2558f84', 'e32e4e1481c2', 'e3dce6e0c750', 'e3fc8296e5ea', 'e6f218027d3c',
  'ead3f094d72a', 'ef69721f921d', 'f1d3376e62e0', 'f27c0f99b0d8', 'f30a139151fb',
  'f729ae13b018', 'f832ad58062f', 'fd5d9da28eba'
];

function App() {
  const [currentView, setCurrentView] = useState('document'); // 'analysis' or 'document'
  const [selectedDocumentId, setSelectedDocumentId] = useState(DOCUMENT_IDS[0]);
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load document data when selected document changes
  useEffect(() => {
    if (selectedDocumentId) {
      loadDocument(selectedDocumentId);
    }
  }, [selectedDocumentId]);

  const loadDocument = async (documentId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadDocumentData(documentId);
      setDocumentData(data);
    } catch (err) {
      setError(`Failed to load document ${documentId}: ${err.message}`);
      console.error('Error loading document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (documentId) => {
    setSelectedDocumentId(documentId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                OCR Error Analysis Tool
              </h1>
              <p className="text-gray-600">
                Analyzing LLM performance on historical texts
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('analysis')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'analysis'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Analysis View
              </button>
              <button
                onClick={() => setCurrentView('document')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'document'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Document View
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Document Selector - Only show for Document View */}
      {currentView === 'document' && (
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Select Document:
              </label>
              <select
                value={selectedDocumentId}
                onChange={(e) => handleDocumentSelect(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DOCUMENT_IDS.map(id => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              
              {loading && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  <span>Loading document...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content based on current view */}
        {currentView === 'analysis' && (
          <OCRAnalysisApp />
        )}

        {currentView === 'document' && documentData && (
          <DocumentAnalysisView documentData={documentData} />
        )}

        {!documentData && !loading && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No document loaded</h3>
              <p className="mt-1 text-sm text-gray-500">Select a document to begin analysis</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              OCR Analysis Tool for "Why and Where LLMs Still Go Wrong: Gaps in Historical Linguistic Competence"
            </p>
            <p className="mt-1">
              Dataset: {DOCUMENT_IDS.length} 18th Century Russian Civil Font Documents (1750-1800)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;