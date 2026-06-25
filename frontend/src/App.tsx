import { useState, useEffect } from 'react';
import { 
  Ticket as TicketIcon, 
  User, 
  ShieldCheck, 
  Search, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Inbox, 
  HelpCircle, 
  CreditCard, 
  Settings, 
  Layers,
  ChevronRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

// TypeScript interfaces matching the backend models
interface Message {
  id: string;
  sender: 'Customer' | 'Agent';
  senderName: string;
  text: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: 'Technical' | 'Billing' | 'Account' | 'General';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function App() {
  // Navigation & View State
  const [viewMode, setViewMode] = useState<'customer' | 'agent'>('agent');
  
  // Ticket Data States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Resolved'>('All');
  
  // Interactive Form States
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // New Ticket Form States
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'Technical' | 'Billing' | 'Account' | 'General'>('Technical');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // App UI feedback states
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch all tickets on load
  const fetchTickets = async (selectIdToRestore?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        // Automatically select the first ticket if in agent mode and nothing selected
        if (data.length > 0) {
          if (selectIdToRestore) {
            setSelectedTicketId(selectIdToRestore);
          } else if (!selectedTicketId) {
            setSelectedTicketId(data[0].id);
          }
        }
      } else {
        showToast('Failed to fetch tickets.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while loading tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Helper for displaying brief toaster warnings/success alerts
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Submit a Support Ticket (Customer role)
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newCustomerName || !newCustomerEmail) {
      showToast('Please fill out all required fields.');
      return;
    }

    try {
      setSubmittingTicket(true);
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
          customerName: newCustomerName,
          customerEmail: newCustomerEmail
        })
      });

      if (res.ok) {
        const created = await res.json();
        setTicketSuccess(true);
        showToast(`Ticket ${created.id} submitted successfully!`);
        
        // Refresh ticket list and auto-select this new ticket
        await fetchTickets(created.id);
        
        // Reset form inputs
        setNewTitle('');
        setNewDescription('');
        setNewCategory('Technical');
        setNewPriority('Medium');
      } else {
        const errData = await res.json();
        showToast(errData.message || 'Error submitting ticket.');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to the server.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // 2. Submit a Message Reply (inside a ticket thread)
  const handleSendReply = async (e: React.FormEvent, senderType: 'Customer' | 'Agent') => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      setSubmittingReply(true);
      const activeTicket = tickets.find(t => t.id === selectedTicketId);
      const senderName = senderType === 'Agent' ? 'Sarah Jenkins (Support)' : (activeTicket?.customerName || 'Customer');

      const res = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderType,
          senderName,
          text: replyText.trim()
        })
      });

      if (res.ok) {
        const updatedTicket = await res.json();
        
        // Update local tickets list state
        setTickets(prev => prev.map(t => t.id === selectedTicketId ? updatedTicket : t));
        setReplyText('');
        showToast('Reply sent successfully.');
      } else {
        showToast('Failed to send reply.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while posting message.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // 3. Update Ticket Status (Agent role)
  const handleUpdateStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        showToast(`Ticket status set to ${newStatus}.`);
      } else {
        showToast('Failed to update ticket status.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during status update.');
    }
  };

  // 4. Update Ticket Priority (Agent role)
  const handleUpdatePriority = async (ticketId: string, newPriority: Ticket['priority']) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      });

      if (res.ok) {
        const updated = await res.json();
        setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
        showToast(`Ticket priority set to ${newPriority}.`);
      } else {
        showToast('Failed to update ticket priority.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during priority update.');
    }
  };

  // 5. Delete Ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm(`Are you sure you want to delete ticket ${ticketId}?`)) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        setSelectedTicketId(null);
        showToast('Ticket deleted successfully.');
      } else {
        showToast('Failed to delete ticket.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error during ticket deletion.');
    }
  };

  // Compute stats/metrics for sidebar/dashboard
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const progressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  // Filtered and searched ticket lists
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchLower) ||
      ticket.id.toLowerCase().includes(searchLower) ||
      ticket.customerName.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower);
    
    return matchesStatus && matchesSearch;
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Helper to get matching category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical': return <Inbox size={18} />;
      case 'Billing': return <CreditCard size={18} />;
      case 'Account': return <User size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  // Helper to format date strings nicely
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="app-container">
      {/* 1. SIDEBAR Navigation */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo-section">
            <TicketIcon size={24} />
            <h1>SupportFlow</h1>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-item ${viewMode === 'agent' ? 'active' : ''}`}
              onClick={() => { setViewMode('agent'); setStatusFilter('All'); }}
            >
              <ShieldCheck />
              <span>Agent Dashboard</span>
            </button>
            <button 
              className={`nav-item ${viewMode === 'customer' ? 'active' : ''}`}
              onClick={() => { setViewMode('customer'); setTicketSuccess(false); }}
            >
              <User />
              <span>Customer Portal</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer - Profile Widget */}
        <div className="user-widget">
          <div className="user-avatar">
            {viewMode === 'agent' ? 'SJ' : 'CU'}
          </div>
          <div className="user-info">
            <span className="user-name">
              {viewMode === 'agent' ? 'Sarah Jenkins' : 'Guest Customer'}
            </span>
            <span className="user-role">
              {viewMode === 'agent' ? 'Tier-2 Engineer' : 'Requester'}
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="main-workspace">
        
        {/* Workspace Top Header */}
        <header className="workspace-header">
          <div className="header-title">
            <h2>{viewMode === 'agent' ? 'Agent Support Console' : 'Submit Ticket & Support Helpdesk'}</h2>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => fetchTickets(selectedTicketId || undefined)}>
              <RotateCcw size={16} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* AGENT VIEW */}
        {viewMode === 'agent' && (
          <>
            {/* Metric Row for agents */}
            <section className="metrics-row">
              <div className="metric-card" style={{ borderLeft: '3px solid #6366f1' }}>
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  <Layers size={20} />
                </div>
                <div className="metric-details">
                  <span className="metric-value">{totalCount}</span>
                  <span className="metric-label">Total Tickets</span>
                </div>
              </div>

              <div className="metric-card" style={{ borderLeft: '3px solid #0096ff' }}>
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(0, 150, 255, 0.1)', color: '#0096ff' }}>
                  <Inbox size={20} />
                </div>
                <div className="metric-details">
                  <span className="metric-value">{openCount}</span>
                  <span className="metric-label">Open Tickets</span>
                </div>
              </div>

              <div className="metric-card" style={{ borderLeft: '3px solid #a855f7' }}>
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                  <TrendingUp size={20} />
                </div>
                <div className="metric-details">
                  <span className="metric-value">{progressCount}</span>
                  <span className="metric-label">In Progress</span>
                </div>
              </div>

              <div className="metric-card" style={{ borderLeft: '3px solid #10b981' }}>
                <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div className="metric-details">
                  <span className="metric-value">{resolvedCount}</span>
                  <span className="metric-label">Resolved</span>
                </div>
              </div>
            </section>

            {/* Split Screen Dashboard (Tickets List + Chat Thread) */}
            <div className="tickets-layout">
              {/* Left Column: Tickets Card list */}
              <div className="ticket-list-panel">
                <div className="search-filter-box">
                  <div className="search-input-wrapper">
                    <Search />
                    <input 
                      type="text" 
                      placeholder="Search title, description, or id..." 
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-tabs">
                    {(['All', 'Open', 'In Progress', 'Resolved'] as const).map(tab => (
                      <button
                        key={tab}
                        className={`tab-btn ${statusFilter === tab ? 'active' : ''}`}
                        onClick={() => setStatusFilter(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ticket cards scrolling area */}
                <div className="ticket-cards-container">
                  {loading && tickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-muted))' }}>Loading...</div>
                  ) : filteredTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'hsl(var(--text-muted))' }}>No tickets found.</div>
                  ) : (
                    filteredTickets.map(t => (
                      <div 
                        key={t.id} 
                        className={`ticket-item ${selectedTicketId === t.id ? 'selected' : ''}`}
                        onClick={() => setSelectedTicketId(t.id)}
                      >
                        <div className="ticket-item-header">
                          <span className="ticket-item-id">{t.id}</span>
                          <span className={`badge ${
                            t.status === 'Open' ? 'badge-status-open' : 
                            t.status === 'In Progress' ? 'badge-status-progress' : 'badge-status-resolved'
                          }`}>
                            {t.status}
                          </span>
                        </div>

                        <div className="ticket-item-title">{t.title}</div>
                        <div className="ticket-item-preview">{t.description}</div>

                        <div className="ticket-item-footer">
                          <span className={`badge ${
                            t.priority === 'High' ? 'badge-priority-high' :
                            t.priority === 'Medium' ? 'badge-priority-medium' : 'badge-priority-low'
                          }`}>
                            {t.priority}
                          </span>
                          <div className="meta-info">
                            <span className="meta-category" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {getCategoryIcon(t.category)}
                              {t.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Chat timeline detail pane */}
              <div className="conversation-panel">
                {selectedTicket ? (
                  <>
                    {/* Header */}
                    <div className="conversation-header">
                      <div className="convo-header-left">
                        <div className="convo-header-meta">
                          <span className="ticket-item-id" style={{ fontSize: '0.85rem' }}>{selectedTicket.id}</span>
                          <span className={`badge ${
                            selectedTicket.status === 'Open' ? 'badge-status-open' : 
                            selectedTicket.status === 'In Progress' ? 'badge-status-progress' : 'badge-status-resolved'
                          }`}>
                            {selectedTicket.status}
                          </span>
                          <span className={`badge ${
                            selectedTicket.priority === 'High' ? 'badge-priority-high' :
                            selectedTicket.priority === 'Medium' ? 'badge-priority-medium' : 'badge-priority-low'
                          }`}>
                            {selectedTicket.priority} Priority
                          </span>
                        </div>
                        <h1 className="convo-header-title">{selectedTicket.title}</h1>
                        <div className="customer-card-meta">
                          Requested by <strong>{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})
                        </div>
                      </div>

                      {/* Admin ticket action selectors */}
                      <div className="convo-header-actions">
                        <div className="admin-control-group">
                          <label>Status</label>
                          <select 
                            value={selectedTicket.status}
                            onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as Ticket['status'])}
                            className="admin-select"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>

                        <div className="admin-control-group">
                          <label>Priority</label>
                          <select 
                            value={selectedTicket.priority}
                            onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value as Ticket['priority'])}
                            className="admin-select"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>

                        <button 
                          className="btn btn-danger-outline" 
                          style={{ padding: '8px 12px' }}
                          onClick={() => handleDeleteTicket(selectedTicket.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Chat Bubble Messages Thread */}
                    <div className="message-thread">
                      {selectedTicket.messages.map((msg) => (
                        <div key={msg.id} className={`message-bubble-wrapper ${msg.sender}`}>
                          <div className="message-meta">
                            <span className="sender-name">{msg.senderName}</span>
                            <span className="timestamp">{formatDate(msg.createdAt)}</span>
                          </div>
                          <div className="message-bubble">
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Agent reply input editor */}
                    <div className="reply-editor-panel">
                      <form onSubmit={(e) => handleSendReply(e, 'Agent')} className="reply-editor-form">
                        <div className="reply-textarea-wrapper">
                          <textarea 
                            className="reply-textarea"
                            placeholder="Type support reply or internal developer comments..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            required
                          />
                        </div>
                        <div className="reply-actions-row">
                          {selectedTicket.status !== 'Resolved' && (
                            <button 
                              type="button" 
                              className="btn btn-secondary"
                              onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolved')}
                            >
                              <CheckCircle2 size={16} />
                              <span>Mark Resolved</span>
                            </button>
                          )}
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={submittingReply || !replyText.trim()}
                          >
                            <Send size={16} />
                            <span>{submittingReply ? 'Sending...' : 'Send Message'}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="no-ticket-selected">
                    <TicketIcon />
                    <h3>No Ticket Selected</h3>
                    <p>Select a ticket from the left sidebar panel to manage its timeline thread.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* CUSTOMER PORTAL VIEW */}
        {viewMode === 'customer' && (
          <div className="customer-portal-view">
            {!ticketSuccess ? (
              <div className="portal-card">
                <div className="portal-title-block">
                  <h3>Submit a Support Ticket</h3>
                  <p>Describe your issue in detail. Our support engineers will get back to you shortly.</p>
                </div>

                <form onSubmit={handleCreateTicket} className="ticket-form">
                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="custName">Your Name *</label>
                      <input 
                        type="text" 
                        id="custName"
                        placeholder="e.g. John Doe"
                        className="form-input"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="custEmail">Email Address *</label>
                      <input 
                        type="email" 
                        id="custEmail"
                        placeholder="e.g. john@example.com"
                        className="form-input"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tktTitle">Ticket Title / Summary *</label>
                    <input 
                      type="text" 
                      id="tktTitle"
                      placeholder="Describe the issue in a few words"
                      className="form-input"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label htmlFor="tktCat">Issue Category *</label>
                      <select 
                        id="tktCat"
                        className="form-select"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        required
                      >
                        <option value="Technical">Technical Support</option>
                        <option value="Billing">Billing & Subscription</option>
                        <option value="Account">Account Access</option>
                        <option value="General">General Inquiry</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="tktPri">Priority *</label>
                      <select 
                        id="tktPri"
                        className="form-select"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        required
                      >
                        <option value="Low">Low - General Questions</option>
                        <option value="Medium">Medium - Feature issues</option>
                        <option value="High">High - Critical Blockers</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tktDesc">Full Description *</label>
                    <textarea 
                      id="tktDesc"
                      placeholder="Please include error messages, steps to reproduce, or upgrade details..."
                      className="form-textarea"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ alignSelf: 'flex-end', padding: '12px 24px' }}
                    disabled={submittingTicket}
                  >
                    <PlusCircle size={18} />
                    <span>{submittingTicket ? 'Submitting...' : 'Submit Support Ticket'}</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Success screen state */
              <div className="portal-card" style={{ maxWidth: '540px' }}>
                <div className="success-screen">
                  <div className="success-icon-container">
                    <CheckCircle2 />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Ticket Submitted!</h3>
                    <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: 1.6 }}>
                      Thank you. We have received your ticket. Our technical support agents have been notified and will respond via email shortly.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setTicketSuccess(false)}
                    >
                      Submit Another Ticket
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setViewMode('agent');
                        setStatusFilter('All');
                      }}
                    >
                      Go to Agent Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* List of customer's active tickets at the bottom */}
            <div style={{ width: '100%', maxWidth: '680px', marginTop: '40px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>My Active Ticket Submissions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tickets.filter(t => t.status !== 'Resolved').length === 0 ? (
                  <div style={{ padding: '24px', backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                    You have no active unresolved support tickets open.
                  </div>
                ) : (
                  tickets.filter(t => t.status !== 'Resolved').map(t => (
                    <div 
                      key={t.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '16px 20px', 
                        backgroundColor: 'hsl(var(--bg-card))', 
                        border: '1px solid hsl(var(--border-color))', 
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>{t.id}</span>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{t.title}</h4>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                          Last updated: {formatDate(t.updatedAt)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge ${
                          t.status === 'Open' ? 'badge-status-open' : 'badge-status-progress'
                        }`}>
                          {t.status}
                        </span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            setViewMode('agent');
                            setSelectedTicketId(t.id);
                          }}
                        >
                          View Thread
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Toast Alert Banner */}
      {toast && (
        <div className="toast">
          <AlertCircle size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
