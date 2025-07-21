import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MessageCircle, ChevronRight, Menu, X } from 'lucide-react';
import { getMyBots, getPublicBots, getChatHistory, deleteBot } from '../services/api';
import BotCard from '../components/BotCard';
import { Bot, ChatMessage, ChatHistoryItem } from '../types';
import { useMediaQuery } from 'react-responsive';

// Default avatar as base64 to avoid file dependency
const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9Ii5ub25zY3JpcHQgY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRIOGE0IDQgMCAwIDAtNCA0djIiPjwvcGF0aD48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiPjwvY2lyY2xlPjwvc3ZnPg==';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'my-bots' | 'public-bots'>('my-bots');
  const [myBots, setMyBots] = useState<Bot[]>([]);
  const [publicBots, setPublicBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const fullName = localStorage.getItem('user_name');
  
  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    loadBots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, navigate]);

  const loadBots = async () => {
    try {
      const [myBotsRes, publicBotsRes] = await Promise.all([
        getMyBots(userId!),
        getPublicBots()
      ]);
      setMyBots(myBotsRes.data);
      setPublicBots(publicBotsRes.data);
    } catch (error) {
      console.error('Error loading bots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    try {
      await deleteBot(botId, userId!);
      // Reload bots after successful deletion
      await loadBots();
    } catch (error) {
      console.error('Error deleting bot:', error);
      throw error; // Re-throw to let BotCard handle the error display
    }
  };

  const loadChatHistory = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingHistory(true);
    try {
      // Get all unique bot IDs from both myBots and publicBots
      const allBots = [...myBots, ...publicBots];
      const uniqueBotIds = Array.from(new Set(allBots.map(bot => bot.bot_id)));
      
      // Fetch chat history for each bot in parallel
      const historyPromises = uniqueBotIds.map(async (botId) => {
        try {
          const response = await getChatHistory(userId, botId);
          if (response.data && response.data.length > 0) {
            const bot = allBots.find(b => b.bot_id === botId);
            const lastMessage: ChatMessage = response.data[response.data.length - 1];
            
            // Ensure we have a valid timestamp
            let validTimestamp = lastMessage.timestamp;
            if (!validTimestamp || isNaN(new Date(validTimestamp).getTime())) {
              console.warn(`Invalid timestamp for bot ${botId}:`, lastMessage.timestamp);
              validTimestamp = new Date().toISOString(); // fallback to current time
            }
            
            return {
              bot_id: botId,
              bot_name: bot?.name || 'Unknown Bot',
              bot_avatar_base64: bot?.avatar_base64,
              last_message: lastMessage.message || lastMessage.response || '',
              timestamp: validTimestamp
            };
          }
          return null;
        } catch (error) {
          console.error(`Error loading history for bot ${botId}:`, error);
          return null;
        }
      });
      
      const historyResults = await Promise.all(historyPromises);
      const validHistory: ChatHistoryItem[] = [];
      historyResults.forEach(item => {
        if (item !== null) {
          validHistory.push({
            bot_id: item.bot_id,
            bot_name: item.bot_name,
            bot_avatar_base64: item.bot_avatar_base64,
            last_message: item.last_message,
            timestamp: item.timestamp
          });
        }
      });
      
      // Sort by timestamp (most recent first)
      validHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setChatHistory(validHistory);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId, myBots, publicBots]);

  useEffect(() => {
    if (myBots.length > 0 || publicBots.length > 0) {
      loadChatHistory();
    }
  }, [loadChatHistory, myBots, publicBots]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return 'Unknown';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Handle negative differences (future dates)
    if (diffInSeconds < 0) {
      console.warn('Future timestamp detected:', timestamp);
      return 'Just now';
    }
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking on a chat on mobile
  const handleChatClick = (botId: string) => {
    setSelectedChat(botId);
    navigate(`/chat/${botId}`);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed md:relative z-30 md:z-0 w-72 md:w-80 h-full bg-white border-r border-gray-200 flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : chatHistory.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {chatHistory.map((chat) => (
                <div 
                  key={chat.bot_id}
                  className={`p-3 md:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedChat === chat.bot_id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleChatClick(chat.bot_id)}
                >
                  <div className="flex items-center space-x-3">
                    <img 
                      src={chat.bot_avatar_base64 || defaultAvatar} 
                      alt={chat.bot_name}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = defaultAvatar;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {chat.bot_name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(chat.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {chat.last_message.length > 50 
                          ? `${chat.last_message.substring(0, 50)}...` 
                          : chat.last_message}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p>No chat history yet</p>
              <p className="text-sm mt-1">Start a new conversation to see it here</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile header */}
        <div className="md:hidden p-4 border-b border-gray-200 bg-white flex items-center justify-between">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Header */}
          <div className="hidden md:block mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Welcome back, {fullName}
                </h1>
                <p className="mt-1 md:mt-2 text-slate-600 text-sm md:text-base">
                  Manage your AI companions and discover new ones
                </p>
              </div>
              <Link
                to="/createbot"
                className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm md:text-base"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Bot
              </Link>
            </div>
            
            {/* Mobile create button */}
            <Link
              to="/createbot"
              className="md:hidden fixed bottom-6 right-6 z-10 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
              aria-label="Create New Bot"
            >
              <Plus className="h-6 w-6" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 md:space-x-8 whitespace-nowrap" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('my-bots')}
                className={`${activeTab === 'my-bots' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                My Bots
                <span className="bg-gray-100 text-gray-600 ml-2 py-0.5 px-2 rounded-full text-xs font-medium">
                  {myBots.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('public-bots')}
                className={`${activeTab === 'public-bots' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Public Bots
                <span className="bg-gray-100 text-gray-600 ml-2 py-0.5 px-2 rounded-full text-xs font-medium">
                  {publicBots.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Bots List */}
          <div className="mt-4 md:mt-6">
            {activeTab === 'my-bots' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {myBots.length > 0 ? (
                  myBots.map((bot) => (
                    <BotCard 
                      key={bot.bot_id} 
                      bot={bot} 
                      isOwner={true} 
                      onUpdate={loadBots}
                      onDelete={handleDeleteBot}
                    />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10">
                    <p className="text-gray-500">You haven't created any bots yet.</p>
                    <Link
                      to="/createbot"
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      Create Your First Bot
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicBots.length > 0 ? (
                  publicBots.map((bot) => (
                    <BotCard key={bot.bot_id} bot={bot} isOwner={false} onUpdate={loadBots} />
                  ))
                ) : (
                  <div className="col-span-3 text-center py-10">
                    <p className="text-gray-500">No public bots available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}