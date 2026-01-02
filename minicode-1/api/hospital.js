/**
 * 医院挂号API接口
 */

const { get, post } = require('../utils/request.js');

/**
 * 获取所有科室
 */
function getDepartments() {
  return get('/hospital/departments');
}

/**
 * 根据科室查询医院
 * @param {String} department - 科室名称
 */
function getHospitalsByDepartment(department) {
  return get('/hospital/by-department', { department });
}

/**
 * 获取所有医院
 */
function getAllHospitals() {
  return get('/hospital/list');
}

/**
 * 获取医院详情
 * @param {String} hospitalId - 医院ID
 */
function getHospitalDetail(hospitalId) {
  return get('/hospital/detail', { hospital_id: hospitalId });
}

/**
 * 创建预约
 * @param {Object} data - 预约数据
 */
function createReservation(data) {
  return post('/hospital/reserve', data);
}

/**
 * 查询用户预约记录
 * @param {String} userId - 用户ID
 */
function getUserReservations(userId) {
  return get('/hospital/reservations', { user_id: userId });
}

module.exports = {
  getDepartments,
  getHospitalsByDepartment,
  getAllHospitals,
  getHospitalDetail,
  createReservation,
  getUserReservations
};
