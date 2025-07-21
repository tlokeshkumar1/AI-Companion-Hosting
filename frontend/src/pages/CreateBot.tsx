import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Save, ArrowLeft } from 'lucide-react';
import { createBot, getBotById, updateBot } from '../services/api';

export default function CreateBot() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);
  // Removed unused state variables
  
  const [form, setForm] = useState({
    name: '',
    bio: '',
    first_message: '',
    situation: '',
    back_story: '',
    personality: '',
    chatting_way: '',
    type_of_bot: '',
    privacy: 'private',
  });
  
  const [avatarBase64, setAvatarBase64] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    
    if (isEditing && editId) {
      loadBotData(editId);
    }
  }, [userId, isEditing, editId, navigate]);

  const loadBotData = async (botId: string) => {
    try {
      const response = await getBotById(botId);
      const bot = response.data;
      console.log('Loaded bot data:', bot); // Debug log
      
      setForm({
        name: bot.name || '',
        bio: bot.bio || '',
        first_message: bot.first_message || '',
        situation: bot.situation || '',
        back_story: bot.back_story || '',
        personality: bot.personality || '',
        chatting_way: bot.chatting_way || '',
        type_of_bot: bot.type_of_bot || '',
        privacy: bot.privacy || 'private',
      });
      
      if (bot.avatar_base64) {
        setAvatarBase64(bot.avatar_base64);
        setAvatarPreview(bot.avatar_base64);
      }
    } catch (error) {
      console.error('Error loading bot data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setAvatarBase64(base64String);
        setAvatarPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) newErrors.name = 'Bot name is required';
    if (!form.bio.trim()) newErrors.bio = 'Bio is required';
    if (!form.first_message.trim()) newErrors.first_message = 'First message is required';
    if (!form.situation.trim()) newErrors.situation = 'Situation is required';
    if (!form.back_story.trim()) newErrors.back_story = 'Back story is required';
    if (!form.personality.trim()) newErrors.personality = 'Personality is required';
    if (!form.chatting_way.trim()) newErrors.chatting_way = 'Chatting way is required';
    if (!form.type_of_bot.trim()) newErrors.type_of_bot = 'Bot type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage('');
    
    const botData = {
      ...form,
      user_id: userId!,
      avatar_base64: avatarBase64 || null
    };

    try {
      console.log('Submitting bot data:', {
        ...form,
        hasAvatar: !!avatarBase64,
        isEditing
      });
      
      if (isEditing && editId) {
        await updateBot(editId, botData);
        setMessage('Bot updated successfully!');
      } else {
        await createBot(botData);
        setMessage('Bot created successfully!');
      }
      
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      console.error('Error saving bot:', error);
      setMessage('Failed to save bot. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-slate-900 mt-4">
          {isEditing ? 'Edit AI Bot' : 'Create New AI Bot'}
        </h1>
        <p className="text-slate-600 mt-2">
          {isEditing ? 'Update your AI companion' : 'Design your personalized AI companion'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Bot Avatar</h2>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Bot avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <div>
              <label className="block">
                <span className="sr-only">Choose avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bot Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., Sarah the Therapist"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bot Type *
              </label>
              <input
                type="text"
                name="type_of_bot"
                value={form.type_of_bot}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.type_of_bot ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., Therapist, Mom, Coder"
              />
              {errors.type_of_bot && <p className="text-red-500 text-xs mt-1">{errors.type_of_bot}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bio *
            </label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.bio ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="A brief description of your bot's purpose and personality..."
            />
            {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
          </div>
        </div>

        {/* Conversation Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Conversation Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                First Message *
              </label>
              <textarea
                name="first_message"
                value={form.first_message}
                onChange={handleChange}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.first_message ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="What your bot will say when starting a conversation..."
              />
              {errors.first_message && <p className="text-red-500 text-xs mt-1">{errors.first_message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Chatting Way *
              </label>
              <input
                type="text"
                name="chatting_way"
                value={form.chatting_way}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.chatting_way ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="e.g., Casual and friendly, Professional, Playful"
              />
              {errors.chatting_way && <p className="text-red-500 text-xs mt-1">{errors.chatting_way}</p>}
            </div>
          </div>
        </div>

        {/* Detailed Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Detailed Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Situation *
              </label>
              <textarea
                name="situation"
                value={form.situation}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.situation ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Describe the context or situation your bot operates in..."
              />
              {errors.situation && <p className="text-red-500 text-xs mt-1">{errors.situation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Back Story *
              </label>
              <textarea
                name="back_story"
                value={form.back_story}
                onChange={handleChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.back_story ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Provide background information about your bot's history, experiences, etc..."
              />
              {errors.back_story && <p className="text-red-500 text-xs mt-1">{errors.back_story}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Personality *
              </label>
              <textarea
                name="personality"
                value={form.personality}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.personality ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Describe your bot's personality traits, quirks, and characteristics..."
              />
              {errors.personality && <p className="text-red-500 text-xs mt-1">{errors.personality}</p>}
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Privacy Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={form.privacy === 'private'}
                onChange={handleChange}
                className="mr-3 text-blue-600"
              />
              <div>
                <span className="font-medium text-slate-900">Private</span>
                <p className="text-sm text-slate-600">Only you can see and chat with this bot</p>
              </div>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={form.privacy === 'public'}
                onChange={handleChange}
                className="mr-3 text-blue-600"
              />
              <div>
                <span className="font-medium text-slate-900">Public</span>
                <p className="text-sm text-slate-600">Everyone can discover and chat with this bot</p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Bot' : 'Create Bot'}
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={`text-center py-4 px-6 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-600 border border-green-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}