import axios from 'axios';

const API = axios.create({
  baseURL: 'https://ai-companion-hosting-backend.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ======================
// Auth Endpoints
// ======================
export const signupUser = (data: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}) => API.post('/auth/signup', data);

export const verifyEmail = (data: {
  email: string;
  otp: string | number; // Accept both string and number for flexibility
}) => API.post('/auth/email-verification', {
  ...data,
  otp: String(data.otp) // Ensure OTP is sent as string
});

export const loginUser = (data: { email: string; password: string }) =>
  API.post('/auth/login', data);

export const requestPasswordReset = (email: string) =>
  API.post('/auth/forgot-password/request', email, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });

export interface VerifyPasswordResetPayload {
  email: string;
  otp: string;
  new_password?: string;
}

export const verifyPasswordResetOTP = (email: string, otp: string, newPassword?: string) => {
  const payload: VerifyPasswordResetPayload = { 
    email, 
    otp: String(otp) // Ensure OTP is string
  };
  
  if (newPassword) {
    payload.new_password = newPassword;
  }
  
  return API.post('/auth/forgot-password/verify', payload);
};

// ======================
// Bot Endpoints
// ======================
export const createBot = (formData: FormData) =>
  API.post('/bots/createbot', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateBot = (botId: string, formData: FormData, signal?: AbortSignal) =>
  API.put(`/bots/${botId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal,
  });

export const getBotById = (id: string, signal?: AbortSignal) =>
  API.get(`/bots/${id}`, signal ? { signal } : undefined);

export const getMyBots = (userId: string, signal?: AbortSignal) =>
  API.get(`/bots/my?user_id=${userId}`, signal ? { signal } : undefined);

export const getPublicBots = (signal?: AbortSignal) => 
  API.get('/bots/public', signal ? { signal } : undefined);

// ======================
// Chat Endpoints
// ======================
export interface SendMessagePayload {
  user_id: string;
  bot_id: string;
  message: string;
  is_system_message?: boolean;
  response?: string;
  message_id?: string;
}

export const sendMessage = (payload: SendMessagePayload) => API.post('/chat/ask', payload);

export const getChatHistory = async (userId: string, botId: string, signal?: AbortSignal) => {
  try {
    console.log('Fetching chat history with params:', { userId, botId });
    const config = {
      params: { 
        user_id: userId, 
        bot_id: botId 
      },
      ...(signal && { signal })
    };
    const response = await API.get(`/chat/history`, config);
    console.log('Chat history response:', response.data);
    return response.data;
  } catch (error: any) {
    // Don't log cancellation errors
    if (axios.isCancel(error) || error?.message === 'canceled') {
      throw error; // Re-throw to be handled by the caller
    }
    
    // Log other errors
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    return { status: 'error', data: [], message: error.message };
  }
};

export const restartChat = (userId: string, botId: string) =>
  API.delete(`/chat/restart?user_id=${userId}&bot_id=${botId}`);

export default API;