"use client";

import { useState } from "react";
import { Upload, Link, FileText, Loader2 } from 'lucide-react';

interface Analysis {
  id: string;
  originalBias: number;
  analysis: {
    summary: string;
    keyPoints: string[];
    biasedPhrases: string[];
  };
  counterpoint: {
    title: string;
    summary: string;
    article: string;
    keyPoints: string[];
    sources: string[];
  };
  screenshot: string | null;
  sourceUrl: string | null;
  timestamp: string;
  shareUrl: string;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
          Unbiaser
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-cyan-300">
              Analyze Political Bias in News Articles
            </h2>
            <p className="text-lg text-gray-300">
              Get balanced perspectives and counterpoints using AI analysis.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-cyan-300">How to Use</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-medium text-pink-400 mb-2">Chrome Extension</h4>
                <ol className="list-decimal list-inside text-gray-300 space-y-2">
                  <li>Install the extension</li>
                  <li>Visit any news article</li>
                  <li>Click the extension icon</li>
                  <li>Get instant analysis</li>
                </ol>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-medium text-pink-400 mb-2">Keyboard Shortcut</h4>
                <p className="text-gray-300">
                  Press <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl</kbd> + 
                  <kbd className="px-2 py-1 bg-gray-800 rounded">Shift</kbd> + 
                  <kbd className="px-2 py-1 bg-gray-800 rounded">U</kbd>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4 text-cyan-300">Features</h3>
            <ul className="grid gap-4 md:grid-cols-3">
              <li className="bg-white/5 p-4 rounded-lg">
                <div className="font-medium text-pink-400 mb-2">Bias Detection</div>
                <p className="text-gray-300">Identify political leanings and biases in articles</p>
              </li>
              <li className="bg-white/5 p-4 rounded-lg">
                <div className="font-medium text-pink-400 mb-2">Counterpoints</div>
                <p className="text-gray-300">Get alternative perspectives and viewpoints</p>
              </li>
              <li className="bg-white/5 p-4 rounded-lg">
                <div className="font-medium text-pink-400 mb-2">Source Analysis</div>
                <p className="text-gray-300">Understand the credibility of sources</p>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
