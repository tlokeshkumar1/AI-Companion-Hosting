import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, RotateCcw, ArrowLeft, Bot, User } from 'lucide-react';
// Axios is used by the API service
import { sendMessage, getChatHistory, getBotById, restartChat } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

// Helper function to format timestamp
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  is_system_message?: boolean;
  message_id?: string;
  updated?: string;
  _id?: string;
  user_id?: string;
  bot_id?: string;
  chat_id?: string;
}

export default function ChatPage() {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  interface Bot {
    id: string;
    name: string;
    avatar_base64?: string;
    type_of_bot?: string;
    first_message?: string;
  }
  
  const [bot, setBot] = useState<Bot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // isLoading is used in the loading state check
  // setIsLoading is used in the fetchData function
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      if (!userId) {
        navigate('/login');
        return;
      }
      if (botId && isMounted) {
        try {
          setIsLoading(true);
          // Load bot data first
          const botResponse = await getBotById(botId, controller.signal);
          if (!isMounted) return;
          
          // Update bot state
          setBot(botResponse.data);
          
          // Then load chat history
          const historyResponse = await getChatHistory(userId, botId, controller.signal);
          if (!isMounted) return;
          
          console.log('Bot data:', botResponse.data);
          console.log('Chat history data:', historyResponse.data);
          
          if (historyResponse.status === 'success') {
            // If no chat history, add the bot's first message
            if (Array.isArray(historyResponse.data) && historyResponse.data.length === 0) {
              console.log('No chat history, adding welcome message');
              const welcomeResponse = botResponse.data.first_message || 'Hello! How can I help you today?';
              const welcomeMessage: ChatMessage = {
                id: 'welcome-' + Date.now(),
                message: '',
                response: welcomeResponse,
                timestamp: new Date().toISOString(),
                is_system_message: true
              };
              console.log('Setting welcome message:', welcomeMessage);
              setChat([welcomeMessage]);
              
              // Store the welcome message in the database
              try {
                await sendMessage({
                  user_id: userId,
                  bot_id: botId,
                  message: '', // Empty message to indicate it's a system message
                  is_system_message: true,
                  response: welcomeResponse,
                  message_id: uuidv4()
                });
              } catch (error) {
                console.error('Failed to store welcome message:', error);
              }
            } else if (Array.isArray(historyResponse.data)) {
              console.log('Setting chat history data:', historyResponse.data);
              // Ensure each message has the required fields
              const formattedMessages = historyResponse.data.map((msg: any) => ({
                id: msg._id || msg.id || msg.message_id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                message: msg.message || '',
                response: msg.response || '',
                timestamp: msg.timestamp || new Date().toISOString(),
                is_system_message: msg.is_system_message || false,
                message_id: msg.message_id || undefined,
                updated: msg.updated || undefined,
                _id: msg._id || undefined,
                user_id: msg.user_id || undefined,
                bot_id: msg.bot_id || undefined,
                chat_id: msg.chat_id || undefined
              }));
              console.log('Formatted messages:', formattedMessages);
              setChat(formattedMessages);
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            // Ignore AbortError as it's expected during component unmount
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
              console.error('Error in fetchData:', error);
              // If there's an error but we have bot data, show the first message
              if (bot) {
                const welcomeMessage: ChatMessage = {
                  id: 'welcome-' + Date.now(),
                  message: '',
                  response: bot.first_message || 'Hello! How can I help you today?',
                  timestamp: new Date().toISOString(),
                  is_system_message: true
                };
                setChat(prev => [...prev, welcomeMessage]);
              }
            }
          } else {
            console.error('An unknown error occurred in fetchData');
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, botId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isSending || !userId || !botId) return;

    const userMessage = input.trim();
    setInput('');
    setIsSending(true);

    // Create a temporary message ID for the user's message
    const messageId = Date.now().toString();
    
    // Add user message immediately
    const newMessage: ChatMessage = {
      id: messageId,
      message: userMessage,
      response: '...', // Temporary loading response
      timestamp: new Date().toISOString(),
      is_system_message: false
    };
    
    setChat((prev: ChatMessage[]) => [...prev, newMessage]);

    try {
      const response = await sendMessage({ 
        user_id: userId, 
        bot_id: botId, 
        message: userMessage 
      });
      
      // Update the message with the bot's response
      setChat((prev: ChatMessage[]) => 
        prev.map((msg: ChatMessage) => 
          msg.id === messageId
            ? {
                ...msg,
                response: response.data.response || "I apologize, but I'm having trouble processing your request."
                // Keep the original timestamp - don't overwrite it
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Update with error message
      setChat((prev: ChatMessage[]) => 
        prev.map((msg: ChatMessage) => 
          msg.id === messageId
            ? {
                ...msg,
                response: 'Sorry, there was an error processing your message. Please try again.'
                // Keep the original timestamp - don't overwrite it
              }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestartChat = async () => {
    if (!userId || !botId) return;
    
    if (window.confirm('Are you sure you want to restart this chat? This will clear all messages and start fresh.')) {
      try {
        // Clear the current chat
        setChat([]);
        
        // Call the restart chat endpoint
        await restartChat(userId, botId);
        
        // Get the bot's first message and set it as the initial message
        if (bot) {
          const welcomeMessage: ChatMessage = {
            id: 'welcome-' + Date.now(),
            message: '',
            response: bot.first_message || 'Hello! How can I help you today?',
            timestamp: new Date().toISOString(),
            is_system_message: true
          };
          setChat([welcomeMessage]);
          
          // Store the welcome message in the database
          try {
            await sendMessage({
              user_id: userId,
              bot_id: botId,
              message: '', // Empty message to indicate it's a system message
              is_system_message: true,
              response: welcomeMessage.response,
              message_id: uuidv4()
            });
          } catch (error) {
            console.error('Failed to store welcome message:', error);
          }
        }
      } catch (error) {
        console.error('Error restarting chat:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {bot && (
            <div className="flex items-center">
              {bot.avatar_base64 ? (
                <img
                  src={bot.avatar_base64}
                  alt={bot.name}
                  className="w-10 h-10 rounded-full object-cover mr-3"
                  onError={(e) => {
                    console.error('Error loading avatar:', bot.avatar_base64);
                    // Fallback to default avatar if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{bot.name}</h1>
                <p className="text-sm text-slate-600">{bot.type_of_bot}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRestartChat}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Restart Chat"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Removed separate welcome message since it's now part of the chat */}

        {chat.map((message, index) => (
          <React.Fragment key={`message-${message.id}-${index}`}>
            {/* User Message - Only show if there's a message */}
            {message.message && (
              <div className="flex items-start space-x-3 justify-end mb-4">
                <div className="flex-1 text-right">
                  <div className="bg-blue-600 text-white rounded-lg p-4 max-w-md ml-auto">
                    <p>{message.message}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Bot Response - Only show if there's a response */}
            {message.response && (
              <div className="flex items-start space-x-3 mb-4">
                <div className="flex-shrink-0">
                  {bot?.avatar_base64 ? (
                    <div className="relative">
                      <img
                        src={bot.avatar_base64}
                        alt={bot.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          console.error('Error loading avatar:', bot.avatar_base64);
                          const img = e.currentTarget;
                          img.style.display = 'none';
                          const fallback = img.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full hidden items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-slate-100 rounded-lg p-4 max-w-md">
                    {message.response === '...' ? (
                      <div className="flex items-center space-x-2">
                        {[0, 1, 2].map((i) => (
                          <div 
                            key={`dot-${i}`}
                            className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          ></div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-800 whitespace-pre-wrap">{message.response}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}