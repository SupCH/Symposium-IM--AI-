import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, UserMinus, MessageSquare, Users, Bell, Clock } from 'lucide-react';
import { friendsAPI, conversationsAPI } from '../services/api';

export default function Friends() {
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState({ received: [], sent: [] });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                friendsAPI.list(),
                friendsAPI.requests()
            ]);
            setFriends(friendsRes.data.friends || []);
            setRequests(requestsRes.data || { received: [], sent: [] });
        } catch (err) {
            console.error('加载数据失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            await friendsAPI.accept(requestId);
            setMessage({ type: 'success', text: '已接受好友请求' });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: '操作失败' });
        }
    };

    const handleReject = async (requestId) => {
        try {
            await friendsAPI.reject(requestId);
            setMessage({ type: 'success', text: '已拒绝好友请求' });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: '操作失败' });
        }
    };

    const handleRemoveFriend = async (friendId) => {
        if (!confirm('确定要删除这位好友吗？')) return;
        try {
            await friendsAPI.remove(friendId);
            setMessage({ type: 'success', text: '好友已删除' });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: '操作失败' });
        }
    };

    const handleStartChat = async (userId) => {
        try {
            await conversationsAPI.create(userId);
            navigate('/');
        } catch (err) {
            setMessage({ type: 'error', text: '无法开始对话' });
        }
    };

    const tabs = [
        { id: 'friends', label: '好友列表', icon: Users, count: friends.length },
        { id: 'received', label: '收到的请求', icon: Bell, count: requests.received?.length || 0 },
        { id: 'sent', label: '发出的请求', icon: Clock, count: requests.sent?.length || 0 }
    ];

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '700px' }}>
                {/* 返回按钮 */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        marginBottom: '1rem',
                        fontFamily: 'var(--font-academic)'
                    }}
                >
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    返回聊天
                </button>

                <h1>好友管理</h1>
                <p className="subtitle">管理您的好友和请求</p>

                {/* 标签栏 */}
                <div style={{
                    display: 'flex',
                    borderBottom: '2px solid var(--border-primary)',
                    marginBottom: '1.5rem'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                marginBottom: '-2px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontFamily: 'var(--font-academic)',
                                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)'
                            }}
                        >
                            <tab.icon style={{ width: '16px', height: '16px' }} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span style={{
                                    padding: '2px 8px',
                                    background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--border-primary)',
                                    color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem'
                                }}>{tab.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* 消息提示 */}
                {message.text && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        background: message.type === 'success' ? '#e8f5e9' : '#ffebee',
                        border: `1px solid ${message.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`,
                        color: message.type === 'success' ? '#2e7d32' : '#c62828'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* 内容区 */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        加载中...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* 好友列表 */}
                        {activeTab === 'friends' && (
                            friends.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    暂无好友
                                </div>
                            ) : (
                                friends.map(friend => (
                                    <UserCard
                                        key={friend.id}
                                        user={friend}
                                        actions={[
                                            { icon: MessageSquare, onClick: () => handleStartChat(friend.id), title: '发消息', color: 'var(--accent-primary)' },
                                            { icon: UserMinus, onClick: () => handleRemoveFriend(friend.id), title: '删除好友', color: '#c62828' }
                                        ]}
                                    />
                                ))
                            )
                        )}

                        {/* 收到的请求 */}
                        {activeTab === 'received' && (
                            (requests.received?.length || 0) === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    暂无好友请求
                                </div>
                            ) : (
                                requests.received.map(req => (
                                    <UserCard
                                        key={req.id}
                                        user={req.user}
                                        subtitle="想添加您为好友"
                                        actions={[
                                            { icon: Check, onClick: () => handleAccept(req.id), title: '接受', color: '#2e7d32' },
                                            { icon: X, onClick: () => handleReject(req.id), title: '拒绝', color: '#c62828' }
                                        ]}
                                    />
                                ))
                            )
                        )}

                        {/* 发出的请求 */}
                        {activeTab === 'sent' && (
                            (requests.sent?.length || 0) === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    暂无发出的请求
                                </div>
                            ) : (
                                requests.sent.map(req => (
                                    <UserCard
                                        key={req.id}
                                        user={req.user}
                                        subtitle="等待对方确认"
                                        actions={[]}
                                    />
                                ))
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// 用户卡片组件
function UserCard({ user, subtitle, actions }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-primary)'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--text-primary)',
                color: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                flexShrink: 0
            }}>
                {(user?.nickname || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{user?.nickname || user?.username}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {subtitle || `@${user?.username}`}
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={action.onClick}
                        title={action.title}
                        style={{
                            padding: '0.5rem',
                            background: action.color,
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <action.icon style={{ width: '16px', height: '16px' }} />
                    </button>
                ))}
            </div>
        </div>
    );
}
