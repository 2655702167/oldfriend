/**
 * 生活缴费API接口
 */

const { get, post } = require('../utils/request.js');

/**
 * 查询用户待缴费项目
 * @param {String} userId - 用户ID
 */
function getUnpaidItems(userId) {
  return get('/payment/unpaid-items', { user_id: userId });
}

/**
 * 查询缴费历史
 * @param {String} userId - 用户ID
 */
function getPaymentHistory(userId) {
  return get('/payment/history', { user_id: userId });
}

/**
 * 语音支付
 * @param {Object} data - 请求数据
 */
function voicePay(data) {
  return post('/payment/voice-pay', data);
}

/**
 * 标记为已支付
 * @param {String} itemId - 缴费项目ID
 */
function markAsPaid(itemId) {
  return post('/payment/mark-paid', { item_id: itemId });
}

module.exports = {
  getUnpaidItems,
  getPaymentHistory,
  voicePay,
  markAsPaid
};
