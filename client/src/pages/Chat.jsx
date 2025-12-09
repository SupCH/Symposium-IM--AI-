import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, PenTool, MoreHorizontal, FileText, Paperclip, Send, MessageSquare } from 'lucide-react';
import { useAuthStore, useChatStore, useFriendsStore } from '../store';
import { conversationsAPI, friendsAPI } from '../services/api';
import { connectSocket, disconnectSocket, sendMessage, sendTyping } from '../socket';

export default function Chat() {
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const { user, logout } = useAuthStore();
    const { conversations, activeConversationId, messages, setConversations, setActiveConversation, setMessages } = useChatStore();
    const { friends, setFriends } = useFriendsStore();

    const navigate = useNavigate();
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const currentMessages = messages[activeConversationId] || [];

    // 初始化
    useEffect(() => {
        connectSocket();
        loadConversations();
        loadFriends();

        return () => {
            disconnectSocket();
        };
    }, []);

    // 滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    const loadConversations = async () => {
        try {
            const response = await conversationsAPI.list();
            setConversations(response.data.conversations);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    };

    const loadFriends = async () => {
        try {
            const response = await friendsAPI.list();
            setFriends(response.data.friends);
        } catch (err) {
            console.error('Failed to load friends:', err);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const response = await conversationsAPI.getMessages(conversationId);
            setMessages(conversationId, response.data.messages);
        } catch (err) {
            console.error('Failed to load messages:', err);
        }
    };

    const handleSelectConversation = (conversationId) => {
        setActiveConversation(conversationId);
        if (!messages[conversationId]) {
            loadMessages(conversationId);
        }
    };

    const handleSendMessage = () => {
        if (!inputText.trim() || !activeConversationId) return;

        sendMessage(activeConversationId, inputText.trim());
        setInputText('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        if (activeConversationId) {
            sendTyping(activeConversationId);
        }
    };

    const handleLogout = () => {
        disconnectSocket();
        logout();
        navigate('/login');
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar">
                {/* Header */}
                <div className="sidebar-header">
                    <h1>Symposium</h1>
                    <p>Instant Discourse System v1.0</p>
                </div>

                {/* Search */}
                <div className="search-container">
                    <div className="search-box">
                        <Search />
                        <input
                            type="text"
                            placeholder="Search Index..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="conversation-list">
                    <div className="section-title">Active Fellows</div>
                    {conversations.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                                onClick={() => handleSelectConversation(conv.id)}
                            >
                                <div className="header">
                                    <span className="name">{conv.name || conv.participant?.nickname || 'Unknown'}</span>
                                    <span className="time">{conv.last_message_time ? formatTime(conv.last_message_time) : ''}</span>
                                </div>
                                <div className="title">
                                    {conv.type === 'group' ? `${conv.member_count || 0} Members` : conv.participant?.status || 'Offline'}
                                </div>
                                <p className="preview">
                                    "{conv.last_message || 'No messages yet'}"
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* User Panel */}
                <div className="user-panel">
                    <div className="user-avatar">
                        {(user?.nickname || user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <div className="username">{user?.nickname || user?.username}</div>
                        <div className="status">Online</div>
                    </div>
                    <PenTool
                        style={{ width: '16px', height: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={handleLogout}
                        title="Logout"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <header className="chat-header">
                            <div className="contact-info">
                                <h2>
                                    <span className="symbol">§</span>
                                    {activeConversation.name || activeConversation.participant?.nickname || 'Unknown'}
                                </h2>
                                <div className="status">
                                    <BookOpen style={{ width: '12px', height: '12px' }} />
                                    Status: <span>{activeConversation.participant?.status || 'In Discussion'}</span>
                                </div>
                            </div>
                            <div className="actions">
                                <button><Search style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} /></button>
                                <button><MoreHorizontal style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} /></button>
                            </div>
                        </header>

                        {/* Messages */}
                        <main className="messages-area">
                            <div className="messages-container">
                                <div className="session-divider">
                                    <span>Session Started: Today</span>
                                </div>

                                {currentMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                                    >
                                        <div className="meta">
                                            <span>Ref. {msg.id}</span>
                                            <span>•</span>
                                            <span>{formatTime(msg.created_at)}</span>
                                        </div>
                                        <div className="bubble">
                                            <span className="quote">"</span>
                                            {msg.type === 'image' ? (
                                                <img src={`http://localhost:3000${msg.content}`} alt="Shared image" />
                                            ) : (
                                                <p>{msg.content}</p>
                                            )}
                                            <div className="corner"></div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </main>

                        {/* Input */}
                        <footer className="input-area">
                            <div className="input-container">
                                <div className="input-box">
                                    <div className="corner tl"></div>
                                    <div className="corner tr"></div>
                                    <div className="corner bl"></div>
                                    <div className="corner br"></div>

                                    <div className="input-toolbar">
                                        <button title="Attach Citation"><BookOpen style={{ width: '16px', height: '16px' }} /></button>
                                        <button title="Upload Document"><FileText style={{ width: '16px', height: '16px' }} /></button>
                                        <button title="Insert Media" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip style={{ width: '16px', height: '16px' }} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                        <div className="spacer"></div>
                                        <span className="mode">Latex Mode: OFF</span>
                                    </div>

                                    <textarea
                                        value={inputText}
                                        onChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        placeholder="在此输入您的论点..."
                                    />

                                    <div className="input-footer">
                                        <span className="hint">Press Enter to submit</span>
                                        <button
                                            className="send-btn"
                                            onClick={handleSendMessage}
                                            disabled={!inputText.trim()}
                                        >
                                            <span>Submit</span>
                                            <Send style={{ width: '12px', height: '12px' }} />
                                        </button>
                                    </div>
                                </div>

                                <p className="input-disclaimer">
                                    All communications are encrypted and archived for peer review.
                                </p>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="empty-state">
                        <MessageSquare className="icon" style={{ width: '64px', height: '64px' }} />
                        <h3>Select a Conversation</h3>
                        <p>Choose a fellow from the sidebar to begin discourse</p>
                    </div>
                )}
            </div>
        </div>
    );
}
