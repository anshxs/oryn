import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import ComposeModal from './components/ComposeModal';
import DomainSettingsModal from './components/DomainSettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import Toast from './components/Toast';
import { api, setupWebSocket } from './services/api';

export default function App() {
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Clean theme state (light by default, with dark toggle)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('oryn_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('oryn_theme', theme);

    // Refresh liquidGL WebGPU/WebGL background refraction snapshot
    setTimeout(() => {
      if (window.__liquidGLRenderer__?.captureSnapshot) {
        window.__liquidGLRenderer__.captureSnapshot();
      }
    }, 120);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Domains & Mailboxes
  const [domains, setDomains] = useState([]);
  const [mailboxes, setMailboxes] = useState([]);
  const [activeMailbox, setActiveMailbox] = useState('');
  
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting');

  // Modals & Notifications
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('domains');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Fetch mailboxes and domains
  const fetchAccountsData = useCallback(async () => {
    try {
      const [domRes, mbRes, setRes] = await Promise.all([
        api.getDomains(),
        api.getMailboxes(),
        api.getSettings()
      ]);
      setDomains(domRes.domains || []);
      setMailboxes(mbRes.mailboxes || []);
      setSettings(setRes.settings || null);

      if (mbRes.mailboxes && mbRes.mailboxes.length > 0) {
        setActiveMailbox(prev => prev || mbRes.mailboxes[0].email);
      }
    } catch (err) {
      console.error('Failed to load domains/mailboxes:', err);
    }
  }, []);

  // Fetch emails for active mailbox
  const fetchEmails = useCallback(async (mailbox = activeMailbox, folder = currentFolder, search = searchQuery) => {
    try {
      setLoading(true);
      const data = await api.getEmails(mailbox, folder, search);
      setEmails(data.emails || []);
      if (data.emails && data.emails.length > 0) {
        setSelectedEmailId(prev => {
          if (prev && data.emails.some(e => e.id === prev)) return prev;
          return data.emails[0].id;
        });
      }
    } catch (err) {
      console.error('Failed to load emails:', err);
    } finally {
      setLoading(false);
    }
  }, [activeMailbox, currentFolder, searchQuery]);

  // Fetch stats for active mailbox
  const fetchStats = useCallback(async (mailbox = activeMailbox) => {
    try {
      const data = await api.getStats(mailbox);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [activeMailbox]);

  // Initial mount & WebSocket listener
  useEffect(() => {
    fetchAccountsData();

    const cleanupWs = setupWebSocket(
      (event) => {
        if (event.type === 'new_email') {
          showToast(`Inbound message received from ${event.payload.from}`, 'info');
          setEmails(prev => [event.payload, ...prev]);
          fetchStats();
        } else if (event.type === 'email_sent') {
          showToast('Message dispatched successfully', 'success');
          fetchStats();
        } else if (event.type === 'email_updated') {
          setEmails(prev => prev.map(e => e.id === event.payload.id ? event.payload : e));
          fetchStats();
        } else if (event.type === 'email_deleted') {
          setEmails(prev => prev.filter(e => e.id !== event.payload.id));
          setSelectedEmailId(prevId => prevId === event.payload.id ? null : prevId);
          fetchStats();
        } else if (
          event.type === 'mailbox_created' || 
          event.type === 'mailbox_deleted' || 
          event.type === 'domain_added' || 
          event.type === 'domain_deleted'
        ) {
          fetchAccountsData();
        }
      },
      (status) => {
        setWsStatus(status);
      }
    );

    return () => cleanupWs();
  }, [fetchAccountsData, fetchStats, showToast]);

  // Re-fetch emails when activeMailbox, currentFolder, or searchQuery changes
  useEffect(() => {
    if (activeMailbox) {
      fetchEmails(activeMailbox, currentFolder, searchQuery);
      fetchStats(activeMailbox);
    }
  }, [activeMailbox, currentFolder, searchQuery]);

  const handleSelectEmail = async (id) => {
    setSelectedEmailId(id);
    const email = emails.find(e => e.id === id);
    if (email && !email.read) {
      try {
        await api.updateEmail(id, { read: true });
        setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
        fetchStats(activeMailbox);
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
      showToast(isTrash ? 'Permanently deleted message' : 'Moved to trash', 'info');
      fetchStats(activeMailbox);
    } catch (err) {
      showToast('Failed to delete email', 'error');
    }
  };

  const handleSimulateInbound = async () => {
    try {
      setIsSimulating(true);
      const res = await api.simulateEmail({
        mailbox: activeMailbox,
        to: activeMailbox,
        subject: `Welcome to ${activeMailbox}!`,
        text: `Hello! This is an RFC 5321 test incoming email sent directly to your configured mailbox ${activeMailbox}.`
      });
      if (res.success) {
        showToast(`Simulated inbound message to ${activeMailbox}`, 'success');
        fetchEmails(activeMailbox, 'inbox');
        setCurrentFolder('inbox');
      }
    } catch (err) {
      showToast('Simulation failed: ' + err.message, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSendEmail = async (payload) => {
    await api.sendEmail({
      ...payload,
      from: payload.from || activeMailbox
    });
    showToast('Message sent successfully', 'success');
    if (currentFolder === 'sent') {
      fetchEmails(activeMailbox, 'sent');
    }
  };

  const handleReply = (email) => {
    setComposeData({
      from: activeMailbox,
      to: email.from,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: `\n\n--- On ${new Date(email.date).toLocaleString()}, ${email.from} wrote ---\n> ${email.text || ''}`
    });
    setIsComposeOpen(true);
  };

  const handleForward = (email) => {
    setComposeData({
      from: activeMailbox,
      to: '',
      subject: email.subject.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${email.from}\nDate: ${new Date(email.date).toLocaleString()}\nSubject: ${email.subject}\n\n${email.text || ''}`
    });
    setIsComposeOpen(true);
  };

  // Keyboard navigation suite (Superhuman & Linear style)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing inside an input or textarea
      const targetTag = e.target.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' || e.target.isContentEditable) {
        return;
      }

      // Check if any modal is active
      if (isComposeOpen || isSettingsOpen || isShortcutsOpen) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setComposeData({ from: activeMailbox });
        setIsComposeOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (emails.length > 0) {
          const currentIndex = emails.findIndex(em => em.id === selectedEmailId);
          const nextIndex = currentIndex < emails.length - 1 ? currentIndex + 1 : 0;
          handleSelectEmail(emails[nextIndex].id);
        }
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (emails.length > 0) {
          const currentIndex = emails.findIndex(em => em.id === selectedEmailId);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : emails.length - 1;
          handleSelectEmail(emails[prevIndex].id);
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (selectedEmailId) {
          const current = emails.find(em => em.id === selectedEmailId);
          if (current) handleToggleStar(selectedEmailId, !current.starred);
        }
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedEmailId) {
          e.preventDefault();
          handleDeleteEmail(selectedEmailId);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedEmailId) {
          e.preventDefault();
          const current = emails.find(em => em.id === selectedEmailId);
          if (current) handleReply(current);
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (selectedEmailId) {
          e.preventDefault();
          const current = emails.find(em => em.id === selectedEmailId);
          if (current) handleForward(current);
        }
      } else if (e.key === 'Escape') {
        setSelectedEmailId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    emails, 
    selectedEmailId, 
    isComposeOpen, 
    isSettingsOpen, 
    isShortcutsOpen, 
    activeMailbox
  ]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#fafafa]/90 dark:bg-[#07080a]/95 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
      {/* Ambient Stage Mesh Backdrop for Real WebGPU / WebGL liquidGL Refraction */}
      <div className="liquid-ambient-backdrop" aria-hidden="true">
        <div className="liquid-orb liquid-orb-1" />
        <div className="liquid-orb liquid-orb-2" />
        <div className="liquid-orb liquid-orb-3" />
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />

      {/* Left Navigation Sidebar */}
      <Sidebar
        currentFolder={currentFolder}
        onSelectFolder={(folder) => {
          setCurrentFolder(folder);
          setSelectedEmailId(null);
        }}
        onOpenCompose={() => {
          setComposeData({ from: activeMailbox });
          setIsComposeOpen(true);
        }}
        onOpenSettings={(tab = 'domains') => {
          setSettingsTab(tab);
          setIsSettingsOpen(true);
        }}
        onSimulateInbound={handleSimulateInbound}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        stats={stats}
        settings={settings}
        domains={domains}
        mailboxes={mailboxes}
        activeMailbox={activeMailbox}
        onSelectMailbox={(mb) => {
          setActiveMailbox(mb);
          setSelectedEmailId(null);
        }}
        isSimulating={isSimulating}
        theme={theme}
        onToggleTheme={toggleTheme}
        wsStatus={wsStatus}
      />

      {/* Middle Email Feed Column */}
      <EmailList
        emails={emails}
        selectedEmailId={selectedEmailId}
        onSelectEmail={handleSelectEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => fetchEmails(activeMailbox, currentFolder, searchQuery)}
        loading={loading}
        currentFolder={currentFolder}
        onToggleStar={handleToggleStar}
        onDeleteEmail={handleDeleteEmail}
      />

      {/* Right Reading & Operating Pane */}
      <EmailDetail
        email={selectedEmail}
        onReply={handleReply}
        onForward={handleForward}
        onDelete={handleDeleteEmail}
        onToggleStar={handleToggleStar}
        onMarkUnread={(id) => api.updateEmail(id, { read: false })}
        onQuickSend={handleSendEmail}
      />

      {/* Dockable Floating Compose Window */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        initialData={composeData}
        defaultFrom={activeMailbox}
        mailboxes={mailboxes}
        activeMailbox={activeMailbox}
      />

      {/* Control Center & DNS Wizard */}
      <DomainSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        settings={settings}
        domains={domains}
        mailboxes={mailboxes}
        activeMailbox={activeMailbox}
        onSelectMailbox={(mb) => setActiveMailbox(mb)}
        onRefreshData={fetchAccountsData}
        onNotify={showToast}
      />

      {/* Keyboard Shortcuts Helper */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
