import dotenv from 'dotenv';

dotenv.config();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

/**
 * 调用 DEEPSEEK API 获取 AI 回复
 * @param {string} systemPrompt - AI 角色设定
 * @param {Array} messages - 对话历史
 * @returns {Promise<string>} AI 回复内容
 */
export async function getAIResponse(systemPrompt, messages) {
    if (!DEEPSEEK_API_KEY) {
        console.error('DEEPSEEK_API_KEY not configured');
        return '抱歉，AI 服务暂时不可用。请稍后再试。';
    }

    try {
        const requestBody = {
            model: DEEPSEEK_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map(msg => ({
                    role: msg.isFromAI ? 'assistant' : 'user',
                    content: msg.content
                }))
            ],
            max_tokens: 1000,
            temperature: 0.7
        };

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('DEEPSEEK API error:', error);
            return '抱歉，AI 服务响应异常。请稍后再试。';
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '抱歉，未能获取有效回复。';

    } catch (error) {
        console.error('DEEPSEEK API call failed:', error);
        return '抱歉，AI 服务连接失败。请检查网络或稍后再试。';
    }
}

/**
 * 获取对话上下文（最近N条消息）
 * @param {Object} db - 数据库实例
 * @param {number} conversationId - 会话ID
 * @param {number} limit - 获取消息数量
 * @returns {Array} 消息列表
 */
export function getConversationContext(db, conversationId, aiUserId, limit = 10) {
    const messages = db.prepare(`
    SELECT content, sender_id
    FROM messages 
    WHERE conversation_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(conversationId, limit);

    return messages.reverse().map(msg => ({
        content: msg.content,
        isFromAI: msg.sender_id === aiUserId
    }));
}
