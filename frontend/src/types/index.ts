export interface Bot {
  bot_id: string;
  name: string;
  avatar_base64?: string;
  type_of_bot: string;
  privacy: 'public' | 'private';
  bio: string;
  first_message?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface ChatMessage {
  _id?: string;
  user_id?: string;
  bot_id?: string;
  chat_id?: string;
  message?: string;
  response?: string;
  timestamp: string;
  is_system_message?: boolean;
  message_id?: string;
  updated?: string;
  // Removed bot_avatar_base64 as it's now fetched from bot document
  // Removed previous_update as it was always null
}

export interface ChatHistoryItem {
  bot_id: string;
  bot_name: string;
  bot_avatar_base64?: string;
  last_message: string;
  timestamp: string;
}