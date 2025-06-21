import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { getFullDocumentAlignment } from '../utils/data_processing_utils';

// Sample data based on your JSON structure (fallback)
const sampleData = {
  "document_info": {
    "document_id": "834bac3679c1",
    "ground_truth": "ЕГО СІЯТЕЛЬСТВУ\nКНЯЗЮ\nАЛЕКСАНДРУ БОРИСОВИЧУ\nКУРАКИНУ\nЕЯ\nІМПЕРАТОРСКАГО\nВЕЛИЧЕСТВА\nСАМОДЕРЖИЦЫ ВСЕРОССІЙСКІЯ\nДѣйствителному\nКАМЕРГЕРУ,\nКАВАЛЕРУ\nОрдена Святаго Александра.\nи прочая."
  },
  "ocr_models": {
    "claude-3-5-sonnet": {
      "fullpage": {
        "lines": [{
          "extracted_text": "ЕГО СІЯТЕЛЬСТВУ\nКНЯЗЮ\nАЛЕКСАНДРУ БОРИСОВИЧУ\nКУРАКИНУ\nЕЯ\nИМПЕРАТОРСКАГО\nВЕЛИЧЕСТВА\nСАМОДЕРЖИЦЫ ВСЕРОССІЙСКІЯ\nДѢЙСТВИТЕЛЬНОМУ\nКАМЕРГЕРУ,\nИ\nКАВАЛЕРУ\nОрдена Святаго Александра.\nи прочая."
        }],
        "metrics": {
          "character_accuracy": 0.9066,
          "old_char_preservation": 0.8667,
          "case_accuracy": 0.8733,
          "word_accuracy": 0.9099
        }
      }
    },
    "gpt-4o": {
      "fullpage": {
        "lines": [{
          "extracted_text": "ЕГО СИЯТЕЉСТВУ\nКНЯЗЮ\nАЛЕКСАНДРУ БОРИСОВИЧУ\nКУРАКИНУ\nЕЯ\nИМПЕРАТОРСКАГО\nВЕЛИЧЕСТВА\nСАМОДЕРЖИЦЫ ВСЕРОССIЙСКIЯ\nДѢЙСТВИТЕЛЬНОМУ\nКАМЕРГЕРУ,\nИ\nКАВАЛЕРУ\nОрдена Святаго Александра.\nи прочiя."
        }],
        "metrics": {
          "character_accuracy": 0.8729,
          "old_char_preservation": 0.6800,
          "case_accuracy": 0.8732,
          "word_accuracy": 0.8525
        }
      }
    },
    "gemini-2.5-flash": {
      "fullpage": {
        "lines": [{
          "extracted_text": "ЕГО СІЯТЕЛЬСТВУ\nКНЯЗЮ\nАЛЕКСАНДРУ БОРИСОВИЧУ\nКУРАКИНУ\nЕЯ\nИМПЕРАТОРСКАГО\nВЕЛИЧЕСТВА\nСАМОДЕРЖИЦЫ ВСЕРОССІИСКІЯ\nДѢЙСТВИТЕЛНОМУ\nКАМЕРГЕРУ,\nи\nКАВАЛЕРУ\nОрдена Свѧтаго Александра.\nи прочая."
        }],
        "metrics": {
          "character_accuracy": 0.9006,
          "old_char_preservation": 1.0000,
          "case_accuracy": 0.8750,
          "word_accuracy": 0.9004
        }
      }
    },
    "llama-4-scout": {
      "fullpage": {
        "lines": [{
          "extracted_text": "его сiятельству\nкнязю\nалександру борисовичу\nкуракину\nея\nимператорскаго\nвеличества\nсамодержицы всероссийския\nдµйствительному\nкамергеру,\nи\nкавалеру\nордена святаго александра.\nи прочая."
        }],
        "metrics": {
          "character_accuracy": 0.3297,
          "old_char_preservation": 0.4333,
          "case_accuracy": 0.2333,
          "word_accuracy": 0.3648
        }
      }
    }
  }
};

const CharacterDiff = ({ original, compared, title }) => {
  const getDiff = (str1, str2) => {
    const result = [];
    const maxLen = Math.max(str1.length, str2.length);
    
    for (let i = 0; i < maxLen; i++) {
      const char1 = str1[i] || '';
      const char2 = str2[i] || '';
      
      if (char1 === char2) {
        result.push({ char: char1, type: 'correct' });
      } else if (char1 && !char2) {
        result.push({ char: char1, type: 'deletion' });
      } else if (!char1 && char2) {
        result.push({ char: char2, type: 'insertion' });
      } else {
        result.push({ char: char2, type: 'substitution' });
      }
    }
    return result;
  };

  const diff = getDiff(original, compared);
  
  const getCharClass = (type) => {
    switch (type) {
      case 'correct': return 'bg-green-100 text-green-800';
      case 'substitution': return 'bg-red-100 text-red-800';
      case 'insertion': return 'bg-blue-100 text-blue-800';
      case 'deletion': return 'bg-yellow-100 text-yellow-800 line-through';
      default: return '';
    }
  };

  return (
    <div className={`${title ? 'mb-4 p-4' : 'mb-2 p-3'} border rounded-lg`}>
      {title && <h4 className="font-semibold mb-2 text-gray-700">{title}</h4>}
      <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
        {diff.map((item, idx) => (
          <span
            key={idx}
            className={`${getCharClass(item.type)} px-0.5 rounded`}
            title={`${item.type}: '${item.char}'`}
          >
            {item.char === '\n' ? '↵\n' : item.char || '∅'}
          </span>
        ))}
      </div>
    </div>
  );
};

const MetricsComparison = ({ models }) => {
  const getDisplayName = (name) => {
    // Special handling for Claude models to show version numbers
    if (name.includes('claude')) {
      if (name.includes('claude-3-5-sonnet')) return 'claude-3.5-sonnet';
      if (name.includes('claude-3-7-sonnet')) return 'claude-3.7-sonnet';
      if (name.includes('claude-sonnet-4')) return 'claude-4-sonnet';
      // Fallback for other claude models
      const parts = name.split('-');
      if (parts.length >= 3) return parts.slice(0, 3).join('-');
    }
    
    // Special handling for Gemini models to show version and type
    if (name.includes('gemini')) {
      if (name.includes('gemini-2.5-pro')) return 'gemini-2.5-pro';
      if (name.includes('gemini-2.5-flash')) return 'gemini-2.5-flash';
      if (name.includes('gemini-2.0-flash')) return 'gemini-2.0-flash';
      // Fallback for other gemini models
      const parts = name.split('-');
      if (parts.length >= 3) return parts.slice(0, 3).join('-');
    }
    
    // For other models, use original logic
    return name.length > 25 ? name.split('-').slice(0, 2).join('-') : name;
  };

  const tableData = Object.entries(models || {}).map(([name, data]) => ({
    model: name,
    displayName: getDisplayName(name),
    character_accuracy: (data?.fullpage?.metrics?.character_accuracy || 0) * 100,
    old_char_preservation: (data?.fullpage?.metrics?.old_char_preservation || 0) * 100,
    case_accuracy: (data?.fullpage?.metrics?.case_accuracy || 0) * 100,
    word_accuracy: (data?.fullpage?.metrics?.word_accuracy || 0) * 100
  }));

  // Sort by character accuracy
  tableData.sort((a, b) => b.character_accuracy - a.character_accuracy);

  // Get top 3 for each metric
  const getTop3 = (metric) => {
    return tableData
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 3)
      .map(item => item.model);
  };

  const top3CharAccuracy = getTop3('character_accuracy');
  const top3OldChar = getTop3('old_char_preservation');
  const top3CaseAccuracy = getTop3('case_accuracy');
  const top3WordAccuracy = getTop3('word_accuracy');

  const getHighlightClass = (modelName, metricTop3, rank) => {
    if (!metricTop3.includes(modelName)) return '';
    
    const position = metricTop3.indexOf(modelName);
    if (position === 0) return 'bg-yellow-100 text-yellow-800 font-bold'; // Gold for #1
    if (position === 1) return 'bg-gray-100 text-gray-800 font-semibold'; // Silver for #2
    if (position === 2) return 'bg-orange-100 text-orange-800 font-semibold'; // Bronze for #3
    return '';
  };

  if (tableData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
        <div className="text-center text-gray-500 py-8">
          No model data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Model</th>
              <th className="px-4 py-2 text-right">Char Accuracy</th>
              <th className="px-4 py-2 text-right">Old Char Preservation</th>
              <th className="px-4 py-2 text-right">Case Accuracy</th>
              <th className="px-4 py-2 text-right">Word Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-2 font-medium">{row.displayName}</td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3CharAccuracy)}`}>
                  {row.character_accuracy.toFixed(1)}%
                </td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3OldChar)}`}>
                  {row.old_char_preservation.toFixed(1)}%
                </td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3CaseAccuracy)}`}>
                  {row.case_accuracy.toFixed(1)}%
                </td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3WordAccuracy)}`}>
                  {row.word_accuracy.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-xs text-gray-600 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 border mr-2"></div>
          <span>1st Place</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border mr-2"></div>
          <span>2nd Place</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-100 border mr-2"></div>
          <span>3rd Place</span>
        </div>
      </div>
    </div>
  );
};


const DatasetOverview = () => {
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDatasetInfo = async () => {
      try {
        const basePath = import.meta.env.BASE_URL || './';
        const url = `${basePath}data/combined_dataset_1000_with_ocr_difficulty.json`;
        console.log('Attempting to load dataset info from:', url);
        const response = await fetch(url);
        console.log('Response status:', response.status, 'Response OK:', response.ok);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log('Successfully loaded dataset info:', jsonData.dataset_info);
        setDatasetInfo(jsonData.dataset_info);
      } catch (error) {
        console.error('Error loading dataset info:', error);
        console.error('Error details:', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDatasetInfo();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Dataset Overview</h3>
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading dataset information...</p>
        </div>
      </div>
    );
  }

  if (!datasetInfo) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Dataset Overview</h3>
        <div className="text-center text-gray-500 py-8">
          No dataset information available
        </div>
      </div>
    );
  }

  const topSubjects = Object.entries(datasetInfo.subject_distribution || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const topDecades = Object.entries(datasetInfo.decade_distribution || {})
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Dataset Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{datasetInfo.total_images?.toLocaleString()}</div>
            <div className="text-sm text-blue-800">Total Images</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{datasetInfo.total_books?.toLocaleString()}</div>
            <div className="text-sm text-green-800">Books</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{datasetInfo.text_statistics?.total_text_lines?.toLocaleString()}</div>
            <div className="text-sm text-purple-800">Text Lines</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{(datasetInfo.text_statistics?.total_characters / 1000).toFixed(0)}K</div>
            <div className="text-sm text-orange-800">Characters</div>
          </div>
        </div>
      </div>

      {/* Time Period and Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Period Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Historical Period Distribution</h4>
          <div className="space-y-3">
            {topDecades.map(([decade, count]) => (
              <div key={decade} className="flex items-center justify-between">
                <span className="text-sm font-medium">{decade}s</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / Math.max(...Object.values(datasetInfo.decade_distribution))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold mb-4">Subject Distribution</h4>
          <div className="space-y-3">
            {topSubjects.map(([subject, count]) => (
              <div key={subject} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{subject}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(count / Math.max(...Object.values(datasetInfo.subject_distribution))) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Text Characteristics */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold mb-4">Text Characteristics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="font-medium mb-2 text-gray-700">Average per Image</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Text Lines:</span>
                <span className="font-medium">{datasetInfo.text_statistics?.avg_lines_per_image?.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Characters:</span>
                <span className="font-medium">{datasetInfo.text_statistics?.avg_chars_per_image?.toFixed(0)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2 text-gray-700">Character Composition</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cyrillic:</span>
                <span className="font-medium">{((datasetInfo.text_statistics?.character_category_percentages?.cyrillic_uppercase + datasetInfo.text_statistics?.character_category_percentages?.cyrillic_lowercase) || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Punctuation:</span>
                <span className="font-medium">{datasetInfo.text_statistics?.character_category_percentages?.punctuation?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Digits:</span>
                <span className="font-medium">{datasetInfo.text_statistics?.character_category_percentages?.digit?.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium mb-2 text-gray-700">OCR Difficulty</h5>
            <div className="space-y-2 text-sm">
              {Object.entries(datasetInfo.text_classification_distributions?.ocr_difficulty || {}).map(([level, count]) => (
                <div key={level} className="flex justify-between">
                  <span className="capitalize">{level}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Research Findings */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Key Research Findings</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-400 pl-4">
            <h4 className="font-medium text-blue-900">Historical Character Preservation</h4>
            <p className="text-sm text-blue-800 mt-1">
              Gemini models show superior preservation of historical Russian characters (ѣ, і, ъ) 
              compared to OpenAI and Meta models, which tend to modernize or misinterpret these forms.
            </p>
          </div>
          <div className="border-l-4 border-green-400 pl-4">
            <h4 className="font-medium text-green-900">Dataset Complexity</h4>
            <p className="text-sm text-green-800 mt-1">
              With {datasetInfo.text_classification_distributions?.ocr_difficulty?.medium || 0} medium difficulty and {datasetInfo.text_classification_distributions?.ocr_difficulty?.hard || 0} hard documents, 
              this dataset represents significant OCR challenges from 18th century Russian Civil Font texts.
            </p>
          </div>
          <div className="border-l-4 border-purple-400 pl-4">
            <h4 className="font-medium text-purple-900">Temporal Coverage</h4>
            <p className="text-sm text-purple-800 mt-1">
              Spanning {Object.keys(datasetInfo.year_distribution || {}).length} years from 1752-1801, 
              with peak coverage in the 1780s-1790s reflecting the height of Russian literary production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DatasetMetricsComparison = () => {
  const [errorData, setErrorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadErrorData = async () => {
      try {
        const basePath = import.meta.env.BASE_URL || './';
        const url = `${basePath}data/common_errors.json`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setErrorData(jsonData);
      } catch (error) {
        console.error('Error loading common errors data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadErrorData();
  }, []);

  const getDisplayName = (name) => {
    if (name.includes('claude')) {
      if (name.includes('claude-3-5-sonnet')) return 'claude-3.5-sonnet';
      if (name.includes('claude-3-7-sonnet')) return 'claude-3.7-sonnet';
      if (name.includes('claude-sonnet-4')) return 'claude-4-sonnet';
      const parts = name.split('-');
      if (parts.length >= 3) return parts.slice(0, 3).join('-');
    }
    
    if (name.includes('gemini')) {
      if (name.includes('gemini-2.5-pro')) return 'gemini-2.5-pro';
      if (name.includes('gemini-2.5-flash')) return 'gemini-2.5-flash';
      if (name.includes('gemini-2.0-flash')) return 'gemini-2.0-flash';
      const parts = name.split('-');
      if (parts.length >= 3) return parts.slice(0, 3).join('-');
    }
    
    return name.length > 25 ? name.split('-').slice(0, 2).join('-') : name;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Dataset Metrics Comparison</h3>
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading metrics data...</p>
        </div>
      </div>
    );
  }

  if (!errorData || !errorData.models || errorData.models.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Dataset Metrics Comparison</h3>
        <div className="text-center text-gray-500 py-8">
          No metrics data available
        </div>
      </div>
    );
  }

  const tableData = errorData.models.map(model => ({
    model: model.name,
    displayName: model.display_name,
    character_accuracy: (model.performance?.avg_character_accuracy || 0) * 100,
    old_char_preservation: (model.performance?.avg_old_char_preservation || 0) * 100,
    case_accuracy: (model.performance?.avg_case_accuracy || 0) * 100,
    word_accuracy: (model.performance?.avg_word_accuracy || 0) * 100
  }));

  // Sort by character accuracy
  tableData.sort((a, b) => b.character_accuracy - a.character_accuracy);

  // Get top 3 for each metric
  const getTop3 = (metric) => {
    return tableData
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 3)
      .map(item => item.model);
  };

  const top3CharAccuracy = getTop3('character_accuracy');
  const top3OldChar = getTop3('old_char_preservation');
  const top3CaseAccuracy = getTop3('case_accuracy');
  const top3WordAccuracy = getTop3('word_accuracy');

  const getHighlightClass = (modelName, metricTop3, rank) => {
    if (!metricTop3.includes(modelName)) return '';
    
    const position = metricTop3.indexOf(modelName);
    if (position === 0) return 'bg-yellow-100 text-yellow-800 font-bold'; // Gold for #1
    if (position === 1) return 'bg-gray-100 text-gray-800 font-semibold'; // Silver for #2
    if (position === 2) return 'bg-orange-100 text-orange-800 font-semibold'; // Bronze for #3
    return '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Dataset Metrics Comparison</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Model</th>
              <th className="px-4 py-2 text-right">Char Accuracy</th>
              <th className="px-4 py-2 text-right">Old Char Preservation</th>
              <th className="px-4 py-2 text-right">Case Accuracy</th>
              <th className="px-4 py-2 text-right">Word Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-4 py-2 font-medium">{row.displayName}</td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3CharAccuracy)}`}>
                  {row.character_accuracy.toFixed(1)}%
                </td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3OldChar)}`}>
                  {row.old_char_preservation.toFixed(1)}%
                </td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3CaseAccuracy)}`}>
                  {row.case_accuracy.toFixed(1)}%
                </td>
                <td className={`px-4 py-2 text-right ${getHighlightClass(row.model, top3WordAccuracy)}`}>
                  {row.word_accuracy.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-xs text-gray-600 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 border mr-2"></div>
          <span>1st Place</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-100 border mr-2"></div>
          <span>2nd Place</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-100 border mr-2"></div>
          <span>3rd Place</span>
        </div>
      </div>
    </div>
  );
};

const CommonErrorsAnalysis = () => {
  const [errorData, setErrorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    const loadErrorData = async () => {
      try {
        const basePath = import.meta.env.BASE_URL || './';
        const url = `${basePath}data/common_errors.json`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log('Loaded JSON data:', jsonData);
        setErrorData(jsonData);
        if (jsonData.models && jsonData.models.length > 0) {
          setSelectedModel(jsonData.models[0].name);
        }
      } catch (error) {
        console.error('Error loading common errors data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadErrorData();
  }, []);


  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Common Errors Analysis</h3>
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading error analysis data...</p>
        </div>
      </div>
    );
  }

  if (!errorData || errorData.models.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Common Errors Analysis</h3>
        <div className="text-center text-gray-500 py-8">
          No error data available
        </div>
      </div>
    );
  }

  const selectedModelData = errorData?.models?.find((m: any) => m.name === selectedModel);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-6">Common Errors Analysis</h3>
      
      {/* Summary Stats */}
      {errorData?.summary && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold mb-2 text-blue-900">Dataset Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>Files Processed: <strong>{errorData.summary.total_files}</strong></div>
            <div>Unique Characters: <strong>{errorData.summary.unique_characters}</strong></div>
            <div>Models Analyzed: <strong>{errorData.summary.models_analyzed}</strong></div>
          </div>
        </div>
      )}
      
      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Model:</label>
        <select 
          value={selectedModel || ''} 
          onChange={(e) => setSelectedModel(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {errorData?.models?.map((model: any, index: number) => (
            <option key={`${model.name}-${index}`} value={model.name}>
              {model.display_name}
            </option>
          ))}
        </select>
      </div>

      {selectedModelData && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-800">Error Summary - {selectedModelData.display_name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Case Errors:</span> {selectedModelData.errors.case_errors.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Foreign Characters:</span> {selectedModelData.errors.foreign_char_stats.total_insertions}
              </div>
              <div>
                <span className="font-medium">Affected Files:</span> {selectedModelData.errors.foreign_char_stats.affected_files}
              </div>
              <div>
                <span className="font-medium">Character Accuracy:</span> {(selectedModelData.performance.avg_character_accuracy * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Top Character Errors */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-800">Top Character Errors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">Pattern</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedModelData.errors.character_errors.slice(0, 10).map((error: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-3 py-2 font-mono text-red-600">{error.pattern}</td>
                        <td className="px-3 py-2 text-right">{error.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="overflow-x-auto">
                <h5 className="font-medium mb-2 text-gray-700">Historical Character Errors</h5>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">Pattern</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedModelData.errors.old_character_errors.slice(0, 10).map((error: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-3 py-2 font-mono text-blue-600">{error.pattern}</td>
                        <td className="px-3 py-2 text-right">{error.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Foreign Characters */}
          {selectedModelData.errors.foreign_chars.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-gray-800">Top Foreign Characters (Not in Ground Truth)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left">Character</th>
                      <th className="px-3 py-2 text-left">Unicode</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedModelData.errors.foreign_chars.slice(0, 15).map((fc: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-3 py-2">
                          <span className="font-mono text-lg mr-2">{fc.character}</span>
                          <span className="text-gray-600 text-xs">({fc.name})</span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{fc.unicode}</td>
                        <td className="px-3 py-2 text-right">{fc.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OCRAnalysisApp = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'metrics', 'errors'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <DatasetOverview />
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            {/* Dataset-wide Metrics from common_errors.json */}
            <DatasetMetricsComparison />
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-6">
            <CommonErrorsAnalysis />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>OCR Analysis Tool for "Why and Where LLMs Still Go Wrong: Gaps in Historical Linguistic Competence"</p>
        </footer>
      </div>
    </div>
  );
};

export default OCRAnalysisApp;