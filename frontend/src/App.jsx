import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import ComposeModal from './components/ComposeModal';
import DomainSettingsModal from './components/DomainSettingsModal';
import Toast from './components/Toast';
import { api, setupWebSocket } from './services/api';

export default function App() {
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Modals & Notifications
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Fetch emails
  const fetchEmails = useCallback(async (folder = currentFolder, search = searchQuery) => {
    try {
      setLoading(true);
      const data = await api.getEmails(folder, search);
      setEmails(data.emails || []);
      if (data.emails && data.emails.length > 0 && !selectedEmailId) {
        setSelectedEmailId(data.emails[0].id);
      }
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFolder, searchQuery, selectedEmailId]);

  // Fetch stats & settings
  const fetchMetadata = useCallback(async () => {
    try {
      const [statsData, settingsData] = await Promise.all([
        api.getStats(),
        api.getSettings()
      ]);
      setStats(statsData.stats);
      setSettings(settingsData.settings);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  }, []);

  // Setup WebSocket & Initial Load
  useEffect(() => {
    fetchEmails(currentFolder, searchQuery);
    fetchMetadata();

    const cleanupWs = setupWebSocket((event) => {
      if (event.type === 'new_email') {
        showToast(`New email received from ${event.payload.from}`, 'info');
        setEmails(prev => [event.payload, ...prev]);
        fetchMetadata();
      } else if (event.type === 'email_sent') {
        showToast('Email sent successfully!', 'success');
        fetchMetadata();
      } else if (event.type === 'email_updated') {
        setEmails(prev => prev.map(e => e.id === event.payload.id ? event.payload : e));
        fetchMetadata();
      } else if (event.type === 'email_deleted') {
        setEmails(prev => prev.filter(e => e.id !== event.payload.id));
        setSelectedEmailId(prevId => prevId === event.payload.id ? null : prevId);
        fetchMetadata();
      }
    });

    return () => {
      cleanupWs();
    };
  }, []);

  // Reload emails when folder or search changes
  useEffect(() => {
    fetchEmails(currentFolder, searchQuery);
  }, [currentFolder, searchQuery]);

  const handleSelectEmail = async (id) => {
    setSelectedEmailId(id);
    const email = emails.find(e => e.id === id);
    if (email && !email.read) {
      // Mark as read
      try {
        await api.updateEmail(id, { read: true });
        setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
        fetchMetadata();
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  const handleToggleStar = async (id, starred) => {
    try {
      await api.updateEmail(id, { starred });
      setEmails(prev => prev.map(e => e.id === id ? { ...e, starred } : e));
    } catch (err) {
      showToast('Failed to update star', 'error');
    }
  };

  const handleDeleteEmail = async (id) => {
    try {
      const isTrash = currentFolder === 'trash';
      await api.deleteEmail(id, isTrash);
      setEmails(prev => prev.filter(e => e.id !== id));
      if (selectedEmailId === id) {
        const remaining = emails.filter(e => e.id !== id);
        setSelectedEmailId(remaining.length > 0 ? remaining[0].id : null);
      }
      showToast(isTrash ? 'Permanently deleted email' : 'Moved email to trash', 'info');
      fetchMetadata();
    } catch (err) {
      showToast('Failed to delete email', 'error');
    }
  };

  const handleSimulateInbound = async () => {
    try {
      setIsSimulating(true);
      const res = await api.simulateEmail();
      if (res.success) {
        showToast(`Simulated incoming mail from ${res.email.from}`, 'success');
        fetchEmails('inbox');
        setCurrentFolder('inbox');
      }
    } catch (err) {
      showToast('Simulation failed: ' + err.message, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSendEmail = async (payload) => {
    await api.sendEmail(payload);
    showToast('Email delivered successfully!', 'success');
    if (currentFolder === 'sent') {
      fetchEmails('sent');
    }
  };

  const handleReply = (email) => {
    setComposeData({
      to: email.from,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: `\n\n--- On ${new Date(email.date).toLocaleString()}, ${email.from} wrote ---\n> ${email.text || ''}`
    });
    setIsComposeOpen(true);
  };

  const handleForward = (email) => {
    setComposeData({
      to: '',
      subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${email.from}\nDate: ${new Date(email.date).toLocaleString()}\nSubject: ${email.subject}\n\n${email.text || ''}`
    });
    setIsComposeOpen(true);
  };

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />

      {/* Left Sidebar */}
      <Sidebar
        currentFolder={currentFolder}
        onSelectFolder={(folder) => {
          setCurrentFolder(folder);
          setSelectedEmailId(null);
        }}
        onOpenCompose={() => {
          setComposeData({});
          setIsComposeOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSimulateInbound={handleSimulateInbound}
        stats={stats}
        settings={settings}
        isSimulating={isSimulating}
      />

      {/* Middle Email List */}
      <EmailList
        emails={emails}
        selectedEmailId={selectedEmailId}
        onSelectEmail={handleSelectEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => fetchEmails(currentFolder, searchQuery)}
        loading={loading}
        currentFolder={currentFolder}
        onToggleStar={handleToggleStar}
        onDeleteEmail={handleDeleteEmail}
      />

      {/* Right Email Detail Pane */}
      <EmailDetail
        email={selectedEmail}
        onReply={handleReply}
        onForward={handleForward}
        onDelete={handleDeleteEmail}
        onToggleStar={handleToggleStar}
        onMarkUnread={(id) => api.updateEmail(id, { read: false })}
      />

      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        initialData={composeData}
        defaultFrom={settings?.defaultFromAddress}
      />

      {/* Domain & Server Settings Modal */}
      <DomainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={async (updated) => {
          const res = await api.updateSettings(updated);
          setSettings(res.settings);
        }}
        onNotify={showToast}
      />
    </div>
  );
}
