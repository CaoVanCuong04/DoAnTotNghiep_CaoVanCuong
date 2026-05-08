import axiosInstance from './axiosInstance'

// ─── Dữ liệu địa lý (public) ──────────────────────────────────────────────────
export const getProvinces = () =>
  axiosInstance.get('/ghn/provinces')

export const getDistricts = (params) =>
  // params: { province_id }
  axiosInstance.get('/ghn/districts', { params })

export const getWards = (params) =>
  // params: { district_id }
  axiosInstance.get('/ghn/wards', { params })

// ─── Tính phí vận chuyển (yêu cầu đăng nhập) ────────────────────────────────
export const calculateShippingFee = (data) =>
  // data: { to_district_id, to_ward_code, service_type_id? }
  axiosInstance.post('/ghn/calculate-fee', data)
