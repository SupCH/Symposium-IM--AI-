import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, PenTool, MoreHorizontal, FileText, Paperclip, Send, MessageSquare, Bot, LogOut } from 'lucide-react';
import { useAuthStore, useChatStore, useFriendsStore } from '../store';
import { conversationsAPI, friendsAPI, aiAPI } from '../services/api';
import { connectSocket, disconnectSocket, sendMessage, sendTyping } from '../socket';

export default function Chat() {
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [aiUsers, setAiUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const { user, logout } = useAuthStore();
    const { conversations, activeConversationId, messages, setConversations, setActiveConversation, setMessages } = useChatStore();
    const { setFriends } = useFriendsStore();

    const navigate = useNavigate();
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const currentMessages = messages[activeConversationId] || [];

    // 初始化
    useEffect(() => {
        connectSocket();
        loadConversations();
        loadFriends();
        loadAIUsers();

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
            console.error('加载会话失败:', err);
        }
    };

    const loadFriends = async () => {
        try {
            const response = await friendsAPI.list();
            setFriends(response.data.friends);
        } catch (err) {
            console.error('加载好友失败:', err);
        }
    };

    const loadAIUsers = async () => {
        try {
            const response = await aiAPI.getUsers();
            setAiUsers(response.data.aiUsers);
        } catch (err) {
            console.error('加载AI用户失败:', err);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const response = await conversationsAPI.getMessages(conversationId);
            setMessages(conversationId, response.data.messages);
        } catch (err) {
            console.error('加载消息失败:', err);
        }
    };

    const handleSelectConversation = (conversationId) => {
        setActiveConversation(conversationId);
        if (!messages[conversationId]) {
            loadMessages(conversationId);
        }
    };

    const handleStartAIChat = async (aiUserId) => {
        try {
            const response = await aiAPI.startChat(aiUserId);
            const { conversationId } = response.data;
            await loadConversations();
            handleSelectConversation(conversationId);
        } catch (err) {
            console.error('开始AI对话失败:', err);
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
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    // 检查当前对话是否是 AI 对话
    const isAIConversation = activeConversation?.participant?.is_ai === 1;

    return (
        <div className="app-container">
            {/* 侧边栏 */}
            <div className="sidebar">
                {/* 顶部标题 */}
                <div className="sidebar-header">
                    <h1>学术论坛</h1>
                    <p>即时学术交流系统 v0.0.3</p>
                </div>

                {/* 搜索框 */}
                <div className="search-container">
                    <div className="search-box">
                        <Search />
                        <input
                            type="text"
                            placeholder="搜索联系人..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* AI 助手列表 */}
                <div className="conversation-list">
                    <div className="section-title">
                        <Bot style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                        AI 助手
                    </div>
                    {aiUsers.map(ai => (
                        <div
                            key={ai.id}
                            className="conversation-item"
                            onClick={() => handleStartAIChat(ai.id)}
                        >
                            <div className="header">
                                <span className="name">
                                    {ai.nickname}
                                    <span style={{
                                        marginLeft: '6px',
                                        padding: '2px 6px',
                                        background: '#8b0000',
                                        color: '#fff',
                                        fontSize: '0.6rem',
                                        fontWeight: 'bold',
                                        borderRadius: '2px'
                                    }}>AI</span>
                                </span>
                            </div>
                            <div className="title">始终在线</div>
                        </div>
                    ))}

                    {/* 会话列表 */}
                    <div className="section-title" style={{ marginTop: '1rem' }}>最近会话</div>
                    {conversations.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                            暂无会话记录
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                                onClick={() => handleSelectConversation(conv.id)}
                            >
                                <div className="header">
                                    <span className="name">
                                        {conv.name || conv.participant?.nickname || '未知用户'}
                                        {conv.participant?.is_ai === 1 && (
                                            <span style={{
                                                marginLeft: '6px',
                                                padding: '2px 6px',
                                                background: '#8b0000',
                                                color: '#fff',
                                                fontSize: '0.6rem',
                                                fontWeight: 'bold',
                                                borderRadius: '2px'
                                            }}>AI</span>
                                        )}
                                    </span>
                                    <span className="time">{conv.last_message_time ? formatTime(conv.last_message_time) : ''}</span>
                                </div>
                                <div className="title">
                                    {conv.type === 'group' ? `${conv.member_count || 0} 位成员` : conv.participant?.status === 'online' ? '在线' : '离线'}
                                </div>
                                <p className="preview">
                                    "{conv.last_message || '暂无消息'}"
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* 用户信息面板 */}
                <div className="user-panel">
                    <div
                        className="user-avatar"
                        onClick={() => navigate('/profile')}
                        style={{ cursor: 'pointer' }}
                        title="编辑个人资料"
                    >
                        {(user?.nickname || user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
                        <div className="username">{user?.nickname || user?.username}</div>
                        <div className="status">在线</div>
                    </div>
                    <Search
                        style={{ width: '16px', height: '16px', cursor: 'pointer', color: 'var(--text-muted)', marginRight: '0.5rem' }}
                        onClick={() => navigate('/search')}
                        title="搜索用户"
                    />
                    <LogOut
                        style={{ width: '16px', height: '16px', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onClick={handleLogout}
                        title="退出登录"
                    />
                </div>
            </div>

            {/* 主内容区 */}
            <div className="main-content">
                {activeConversation ? (
                    <>
                        {/* 聊天头部 */}
                        <header className="chat-header">
                            <div className="contact-info">
                                <h2>
                                    <span className="symbol">§</span>
                                    {activeConversation.name || activeConversation.participant?.nickname || '未知用户'}
                                    {isAIConversation && (
                                        <span style={{
                                            marginLeft: '10px',
                                            padding: '4px 10px',
                                            background: '#8b0000',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            borderRadius: '3px',
                                            verticalAlign: 'middle'
                                        }}>AI</span>
                                    )}
                                </h2>
                                <div className="status">
                                    <BookOpen style={{ width: '12px', height: '12px' }} />
                                    状态：<span>{isAIConversation ? 'AI 助手' : (activeConversation.participant?.status === 'online' ? '在线' : '离线')}</span>
                                </div>
                            </div>
                            <div className="actions">
                                <button title="搜索消息"><Search style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} /></button>
                                <button title="更多选项"><MoreHorizontal style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} /></button>
                            </div>
                        </header>

                        {/* 消息区域 */}
                        <main className="messages-area">
                            <div className="messages-container">
                                <div className="session-divider">
                                    <span>会话开始于：今天</span>
                                </div>

                                {currentMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                                    >
                                        <div className="meta">
                                            {msg.is_ai === 1 && (
                                                <span style={{ color: '#8b0000', fontWeight: 'bold' }}>[AI]</span>
                                            )}
                                            <span>编号 {msg.id}</span>
                                            <span>•</span>
                                            <span>{formatTime(msg.created_at)}</span>
                                        </div>
                                        <div className="bubble">
                                            <span className="quote">"</span>
                                            {msg.type === 'image' ? (
                                                <img src={`http://localhost:50001${msg.content}`} alt="图片消息" />
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

                        {/* 输入区域 */}
                        <footer className="input-area">
                            <div className="input-container">
                                <div className="input-box">
                                    <div className="corner tl"></div>
                                    <div className="corner tr"></div>
                                    <div className="corner bl"></div>
                                    <div className="corner br"></div>

                                    <div className="input-toolbar">
                                        <button title="添加引用"><BookOpen style={{ width: '16px', height: '16px' }} /></button>
                                        <button title="上传文档"><FileText style={{ width: '16px', height: '16px' }} /></button>
                                        <button title="插入图片" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip style={{ width: '16px', height: '16px' }} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                        <div className="spacer"></div>
                                        <span className="mode">{isAIConversation ? 'AI 模式：开启' : 'LaTeX 模式：关闭'}</span>
                                    </div>

                                    <textarea
                                        value={inputText}
                                        onChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        placeholder={isAIConversation ? "向 AI 助手提问..." : "在此输入消息内容..."}
                                    />

                                    <div className="input-footer">
                                        <span className="hint">按 Enter 发送</span>
                                        <button
                                            className="send-btn"
                                            onClick={handleSendMessage}
                                            disabled={!inputText.trim()}
                                        >
                                            <span>发 送</span>
                                            <Send style={{ width: '12px', height: '12px' }} />
                                        </button>
                                    </div>
                                </div>

                                <p className="input-disclaimer">
                                    {isAIConversation
                                        ? 'AI 回复由 DEEPSEEK 生成，仅供参考。'
                                        : '所有通讯内容均已加密并存档。'
                                    }
                                </p>
                            </div>
                        </footer>
                    </>
                ) : (
                    <div className="empty-state">
                        <MessageSquare className="icon" style={{ width: '64px', height: '64px' }} />
                        <h3>选择一个会话</h3>
                        <p>从侧边栏选择好友或 AI 助手开始对话</p>
                    </div>
                )}
            </div>
        </div>
    );
}
