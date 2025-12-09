import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, UserPlus, MessageSquare, Bot } from 'lucide-react';
import { userAPI, friendsAPI, conversationsAPI } from '../services/api';

export default function SearchUsers() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await userAPI.search(query);
            setResults(response.data.users || []);
            if (response.data.users?.length === 0) {
                setMessage({ type: 'info', text: '未找到匹配的用户' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: '搜索失败，请稍后重试' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (userId) => {
        try {
            await friendsAPI.sendRequest(userId);
            setMessage({ type: 'success', text: '好友请求已发送！' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '发送请求失败' });
        }
    };

    const handleStartChat = async (userId) => {
        try {
            const response = await conversationsAPI.create(userId);
            navigate('/');
        } catch (err) {
            setMessage({ type: 'error', text: '无法开始对话' });
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '600px' }}>
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

                <h1>搜索用户</h1>
                <p className="subtitle">通过用户名或昵称查找用户</p>

                {/* 搜索表单 */}
                <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="输入用户名或昵称..."
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                border: '1px solid var(--border-primary)',
                                background: 'var(--bg-primary)',
                                fontFamily: 'var(--font-academic)',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--text-primary)',
                                color: 'var(--bg-primary)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontFamily: 'var(--font-academic)'
                            }}
                        >
                            <Search style={{ width: '16px', height: '16px' }} />
                            搜索
                        </button>
                    </div>
                </form>

                {/* 消息提示 */}
                {message.text && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        background: message.type === 'success' ? '#e8f5e9' : message.type === 'info' ? '#e3f2fd' : '#ffebee',
                        border: `1px solid ${message.type === 'success' ? '#a5d6a7' : message.type === 'info' ? '#90caf9' : '#ef9a9a'}`,
                        color: message.type === 'success' ? '#2e7d32' : message.type === 'info' ? '#1565c0' : '#c62828'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* 搜索结果 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {results.map(user => (
                        <div
                            key={user.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                border: '1px solid var(--border-primary)',
                                background: 'var(--bg-primary)'
                            }}
                        >
                            {/* 头像 */}
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
                                {user.is_ai ? (
                                    <Bot style={{ width: '24px', height: '24px' }} />
                                ) : (
                                    (user.nickname || user.username).charAt(0).toUpperCase()
                                )}
                            </div>

                            {/* 用户信息 */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {user.nickname || user.username}
                                    {user.is_ai === 1 && (
                                        <span style={{
                                            padding: '2px 6px',
                                            background: '#8b0000',
                                            color: '#fff',
                                            fontSize: '0.6rem',
                                            fontWeight: 'bold',
                                            borderRadius: '2px'
                                        }}>AI</span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    @{user.username}
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleStartChat(user.id)}
                                    style={{
                                        padding: '0.5rem',
                                        background: 'var(--accent-primary)',
                                        color: '#fff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                    title="发起对话"
                                >
                                    <MessageSquare style={{ width: '16px', height: '16px' }} />
                                </button>
                                {!user.is_ai && (
                                    <button
                                        onClick={() => handleAddFriend(user.id)}
                                        style={{
                                            padding: '0.5rem',
                                            background: 'var(--text-primary)',
                                            color: 'var(--bg-primary)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        title="添加好友"
                                    >
                                        <UserPlus style={{ width: '16px', height: '16px' }} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
