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
  message?: string;
  response?: string;
  timestamp: string;
  // Add other message properties as needed
}

export interface ChatHistoryItem {
  bot_id: string;
  bot_name: string;
  bot_avatar_base64?: string;
  last_message: string;
  timestamp: string;
}
