const axios = require('axios');

const sendTelegramAlert = async (message) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.warn("⚠️ Telegram Alert skipped (Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)");
            return false;
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const response = await axios.post(url, {
            chat_id: chatId,
            text: message
        });
        
        return response.data.ok;
    } catch (err) {
        console.error("❌ Telegram Alert Error:", err.response ? err.response.data : err.message);
        return false;
    }
};

module.exports = { sendTelegramAlert };
