import React, { useState } from 'react';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import BooksPage from './pages/BooksPage.jsx';
import ScanPage from './pages/ScanPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import MembersPage from './pages/MembersPage.jsx';
import CopyLabels from './components/CopyLabels.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAccessionCode, setSelectedAccessionCode] = useState('');

  const handleSelectAccessionCode = (code) => {
    setSelectedAccessionCode(code);
    setActiveTab('scan');
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <DashboardPage
          onNavigate={setActiveTab}
          onSelectAccessionCode={handleSelectAccessionCode}
        />
      )}
      {activeTab === 'books' && (
        <BooksPage onSelectAccessionCode={handleSelectAccessionCode} />
      )}
      {activeTab === 'scan' && (
        <ScanPage
          initialAccessionCode={selectedAccessionCode}
          onTransactionComplete={() => setSelectedAccessionCode('')}
        />
      )}
      {activeTab === 'history' && <HistoryPage />}
      {activeTab === 'members' && <MembersPage onNavigateToScan={handleSelectAccessionCode} />}
      {activeTab === 'labels' && <CopyLabels />}
    </Layout>
  );
}
