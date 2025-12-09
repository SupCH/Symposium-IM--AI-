import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Save, User } from 'lucide-react';
import { useAuthStore } from '../store';
import { userAPI, filesAPI } from '../services/api';

export default function Profile() {
    const { user, updateUser } = useAuthStore();
    const [formData, setFormData] = useState({
        nickname: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            setFormData({
                nickname: user.nickname || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await userAPI.updateProfile(formData);
            updateUser(response.data.user);
            setMessage({ type: 'success', text: '资料更新成功！' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '更新失败，请稍后重试' });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: '请选择图片文件' });
            return;
        }

        // 验证文件大小 (最大 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: '图片大小不能超过 5MB' });
            return;
        }

        setLoading(true);
        try {
            const response = await filesAPI.uploadAvatar(file);
            const avatarUrl = response.data.url;

            // 更新用户资料
            await userAPI.updateProfile({ avatar: avatarUrl });
            updateUser({ avatar: avatarUrl });
            setMessage({ type: 'success', text: '头像更新成功！' });
        } catch (err) {
            setMessage({ type: 'error', text: '头像上传失败，请稍后重试' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px' }}>
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

                <h1>个人资料</h1>
                <p className="subtitle">编辑您的个人信息</p>

                {/* 头像区域 */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'var(--text-primary)',
                            color: 'var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            border: '3px solid var(--border-primary)'
                        }}>
                            {user?.avatar && user.avatar !== '/default-avatar.png' ? (
                                <img
                                    src={`http://localhost:50001${user.avatar}`}
                                    alt="头像"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                (user?.nickname || user?.username || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--accent-primary)',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Camera style={{ width: '16px', height: '16px' }} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleAvatarChange}
                        />
                    </div>
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

                {/* 表单 */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>用户名</label>
                        <input
                            type="text"
                            value={user?.username || ''}
                            disabled
                            style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>用户名不可修改</small>
                    </div>

                    <div className="form-group">
                        <label>昵称</label>
                        <input
                            type="text"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleChange}
                            placeholder="输入您的昵称"
                        />
                    </div>

                    <div className="form-group">
                        <label>邮箱</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="输入您的邮箱"
                        />
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? '保存中...' : (
                            <>
                                <Save style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} />
                                保存修改
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
