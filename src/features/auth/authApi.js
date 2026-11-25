import { api } from '../../shared/api/client'

export const authApi = {
  requestOtp: (email) => api('/auth/otp/request', { method: 'POST', body: { email }, auth: false }),
  verifyOtp: (email, otp) => api('/auth/otp/verify', { method: 'POST', body: { email, otp }, auth: false }),
}
