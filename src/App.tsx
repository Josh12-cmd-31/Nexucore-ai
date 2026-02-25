/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0A0A0A]">
        <Routes>
          <Route path="/" element={<ChatInterface initialPersona="user" />} />
          <Route path="/developer" element={<ChatInterface initialPersona="developer" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

