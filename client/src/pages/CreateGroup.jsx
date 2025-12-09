import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Users } from 'lucide-react';
import { friendsAPI, conversationsAPI } from '../services/api';

export default function CreateGroup() {
    const [groupName, setGroupName] = useState('');
    const [friends, setFriends] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        try {
            const response = await friendsAPI.list();
            setFriends(response.data.friends || []);
        } catch (err) {
            console.error('加载好友失败:', err);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            setMessage({ type: 'error', text: '请输入群组名称' });
            return;
        }
        if (selectedIds.length < 1) {
            setMessage({ type: 'error', text: '请至少选择一位成员' });
            return;
        }

        setLoading(true);
        try {
            await conversationsAPI.createGroup(groupName.trim(), selectedIds);
            setMessage({ type: 'success', text: '群组创建成功！' });
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            setMessage({ type: 'error', text: '创建失败，请稍后重试' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px' }}>
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

                <h1>创建群组</h1>
                <p className="subtitle">选择好友创建群聊</p>

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

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>群组名称</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="输入群组名称"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>选择成员 ({selectedIds.length} 已选)</label>
                        <div style={{
                            maxHeight: '250px',
                            overflowY: 'auto',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px'
                        }}>
                            {friends.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    暂无好友，请先添加好友
                                </div>
                            ) : (
                                friends.map(friend => (
                                    <div
                                        key={friend.id}
                                        onClick={() => toggleSelect(friend.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            cursor: 'pointer',
                                            background: selectedIds.includes(friend.id) ? 'var(--bg-secondary)' : 'transparent',
                                            borderBottom: '1px solid var(--border-primary)'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid var(--border-primary)',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: selectedIds.includes(friend.id) ? 'var(--accent-primary)' : 'transparent'
                                        }}>
                                            {selectedIds.includes(friend.id) && (
                                                <Check style={{ width: '14px', height: '14px', color: '#fff' }} />
                                            )}
                                        </div>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'var(--text-primary)',
                                            color: 'var(--bg-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem'
                                        }}>
                                            {(friend.nickname || friend.username).charAt(0).toUpperCase()}
                                        </div>
                                        <span>{friend.nickname || friend.username}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading || selectedIds.length < 1}
                    >
                        {loading ? '创建中...' : (
                            <>
                                <Users style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                                创建群组
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
