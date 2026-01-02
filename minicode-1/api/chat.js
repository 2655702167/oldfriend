/**
 * 智能对话API接口
 */

const { post } = require('../utils/request.js');

/**
 * 发送对话消息
 * @param {String} userId - 用户ID
 * @param {String} message - 消息内容
 */
function sendMessage(userId, message) {
  return post('/chat/talk', {
    userId: userId,
    message: message
  });
}

module.exports = {
  sendMessage
};
