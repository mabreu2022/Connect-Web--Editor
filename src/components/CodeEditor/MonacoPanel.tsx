import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEditor } from '../../context/EditorContext';

export const MonacoPanel: React.FC = () => {
  const { activePage, rawHtml, rawCss, rawJs, setRawHtml, setRawCss, setRawJs } = useEditor();
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');

  const getLanguage = () => {
    switch (activeTab) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
    }
  };

  const getValue = () => {
    switch (activeTab) {
      case 'html': return rawHtml;
      case 'css': return rawCss;
      case 'js': return rawJs;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    if (activeTab === 'html') setRawHtml(val);
    else if (activeTab === 'css') setRawCss(val);
    else if (activeTab === 'js') setRawJs(val);
  };

  return (
    <div className="monaco-panel">
      <div className="monaco-header">
        <div className="code-tabs">
          <button
            className={`code-tab-btn ${activeTab === 'html' ? 'active' : ''}`}
            onClick={() => setActiveTab('html')}
          >
            {activePage ? activePage.fileName : 'index.html'}
          </button>
          <button
            className={`code-tab-btn ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            styles.css
          </button>
          <button
            className={`code-tab-btn ${activeTab === 'js' ? 'active' : ''}`}
            onClick={() => setActiveTab('js')}
          >
            script.js
          </button>
        </div>

        <span style={{ fontSize: '11px', color: '#888' }}>
          Monaco Code Editor
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={getLanguage()}
          theme="vs-dark"
          value={getValue()}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            fontFamily: "'Fira Code', monospace"
          }}
        />
      </div>
    </div>
  );
};
