'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Redoc: any;
  }
}

export default function ApiDocsPage() {
  const redocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRedoc = () => {
      // Load Redoc from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js';
      script.onload = () => {
        if (window.Redoc && redocRef.current) {
          window.Redoc.init('https://9sj3qz07ie.execute-api.us-east-1.amazonaws.com/system/openapi?format=json', {
            theme: {
              colors: {
                primary: {
                  main: '#2563eb'
                },
                success: {
                  main: '#10b981'
                },
                warning: {
                  main: '#f59e0b'
                },
                error: {
                  main: '#ef4444'
                }
              },
              typography: {
                fontSize: '14px',
                lineHeight: '1.5em',
                code: {
                  fontSize: '13px',
                  fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                },
                headings: {
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: '600'
                }
              },
              sidebar: {
                width: '300px',
                backgroundColor: '#fafafa'
              },
              rightPanel: {
                backgroundColor: '#263238',
                width: '40%'
              }
            },
            scrollYOffset: 60,
            hideDownloadButton: false,
            disableSearch: false,
            expandResponses: 'all',
            jsonSampleExpandLevel: 2,
            hideSchemaPattern: true,
            showExtensions: false,
            sortPropsAlphabetically: true,
            payloadSampleIdx: 0,
            menuToggle: true,
            pathInMiddlePanel: true,
            requiredPropsFirst: true,
            expandSingleSchemaField: true,
            simpleOneOfTypeLabel: true
          }, redocRef.current);
        }
      };
      document.head.appendChild(script);
    };

    loadRedoc();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-gray-600 mt-1">
                Complete reference for the ListBackup.ai API
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="https://9sj3qz07ie.execute-api.us-east-1.amazonaws.com/system/openapi?format=json" 
                download="listbackup-openapi.json"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download JSON Spec
              </a>
              <a 
                href="/dashboard" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Redoc Container */}
      <div ref={redocRef} className="w-full" />
    </div>
  );
}