import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Settings, Globe, Lock, User, Trash2 } from 'lucide-react';

interface Bot {
  bot_id: string;
  avatar_base64?: string;
  name: string;
  type_of_bot: string;
  privacy: 'public' | 'private';
  bio: string;
  first_message?: string;
}

interface BotCardProps {
  bot: Bot;
  isOwner: boolean;
  onUpdate?: () => Promise<void>;
  onDelete?: (botId: string) => Promise<void>;
}

export default function BotCard({ bot, isOwner, onDelete }: BotCardProps) {
  const navigate = useNavigate();

  const handleChatClick = () => {
    navigate(`/chat/${bot.bot_id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to the edit page with the bot's ID
    navigate(`/createbot?edit=${bot.bot_id}`, { state: { botId: bot.bot_id } });
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${bot.name}"? This action cannot be undone.`)) {
      try {
        if (onDelete) {
          await onDelete(bot.bot_id);
        }
      } catch (error) {
        console.error('Error deleting bot:', error);
        alert('Failed to delete bot. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          {bot.avatar_base64 ? (
            <img
              src={bot.avatar_base64}
              alt={bot.name}
              onError={(e) => {
                // If image fails to load, show the default avatar
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.style.display = 'none';
                target.parentElement!.querySelector('.default-avatar')?.classList.remove('hidden');
              }}
              className="w-16 h-16 rounded-full object-cover mr-4"
            />
          ) : null}
          <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4 default-avatar ${bot.avatar_base64 ? 'hidden' : ''}`}>
            <User className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">{bot.name}</h3>
            <div className="flex items-center mt-1">
              <span className="text-sm text-blue-600 font-medium mr-2">{bot.type_of_bot}</span>
              {bot.privacy === 'public' ? (
                <Globe className="h-4 w-4 text-emerald-500" />
              ) : (
                <Lock className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        </div>
        
        <p className="text-slate-600 text-sm mb-4 line-clamp-3">{bot.bio}</p>
        
        {bot.first_message && (
          <div className="bg-slate-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-slate-700 italic">"{bot.first_message}"</p>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={handleChatClick}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </button>
          {isOwner && (
            <>
              <button
                onClick={handleEditClick}
                className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}