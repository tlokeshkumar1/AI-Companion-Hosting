import React from 'react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bot, MessageCircle, Users, Sparkles } from 'lucide-react';
import { getPublicBots } from '../services/api';

type BotType = {
  bot_id: string;
  name: string;
  type_of_bot: string;
  bio: string;
  avatar_base64: string | null;
  privacy: string;
};

// Fallback sample bots if no real bots exist
const sampleBots = [
  {
    bot_id: 'sample-1',
    name: "Sarah the Therapist",
    type_of_bot: "Counselor",
    bio: "A compassionate AI therapist ready to listen and provide emotional support",
    avatar_base64: null,
    privacy: 'public'
  },
  {
    bot_id: 'sample-2',
    name: "Code Master",
    type_of_bot: "Developer",
    bio: "Expert programming mentor to help you learn and solve coding challenges",
    avatar_base64: null,
    privacy: 'public'
  },
  {
    bot_id: 'sample-3',
    name: "Mom Bot",
    type_of_bot: "Family",
    bio: "Your caring virtual mom who's always there for advice and encouragement",
    avatar_base64: null,
    privacy: 'public'
  }
];

export default function Landing() {
  const [featuredBots, setFeaturedBots] = useState<BotType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('user_id'));

  // Listen for storage changes to update auth state
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('user_id'));
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event that we'll dispatch on logout
    window.addEventListener('authChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const loadFeaturedBots = async () => {
      try {
        const response = await getPublicBots();
        const publicBots = response.data;
        
        if (publicBots && publicBots.length > 0) {
          // Show up to 6 featured bots, or all if less than 6
          setFeaturedBots(publicBots.slice(0, 6));
        } else {
          // Use sample bots if no real bots exist
          setFeaturedBots(sampleBots);
        }
      } catch (error) {
        console.error('Error loading featured bots:', error);
        // Fallback to sample bots on error
        setFeaturedBots(sampleBots);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeaturedBots();
  }, []);

  const getAvatarUrl = (bot: BotType) => {
    return bot.avatar_base64 || null;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Your Personal
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> AI Companions</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Create personalized AI companions with unique personalities. Chat with your virtual mom, 
            coding mentor, therapist, or any character you can imagine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <Link 
                to="/signup" 
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-lg font-semibold"
              >
                Get Started Free
              </Link>
            )}
            <Link 
              to={isAuthenticated ? "/dashboard" : "/dashboard"} 
              className={`px-8 py-3 ${isAuthenticated ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'} rounded-lg transition-colors shadow-lg text-lg font-semibold`}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Explore Bots'}
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Custom AI Personalities</h3>
            <p className="text-slate-600">Create unique AI companions with custom personalities, backstories, and conversation styles.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Natural Conversations</h3>
            <p className="text-slate-600">Engage in meaningful, context-aware conversations powered by advanced AI technology.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Share & Discover</h3>
            <p className="text-slate-600">Share your creations with the community and discover amazing bots created by others.</p>
          </div>
        </div>
      </div>

      {/* Sample Bots Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {featuredBots.length > 0 && featuredBots[0].bot_id !== 'sample-1' 
              ? 'Featured AI Companions' 
              : 'Sample AI Companions'}
          </h2>
          <p className="text-xl text-slate-600">
            {featuredBots.length > 0 && featuredBots[0].bot_id !== 'sample-1'
              ? 'Discover amazing AI companions created by our community'
              : 'Get inspired by these example AI companions you can create'}
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Loading featured bots...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBots.map((bot) => (
              <div key={bot.bot_id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-slate-200">
                <div className="flex items-center mb-4">
                  {getAvatarUrl(bot) ? (
                    <img 
                      src={getAvatarUrl(bot) as string} 
                      alt={bot.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{bot.name}</h3>
                    <p className="text-blue-600 font-medium">{bot.type_of_bot}</p>
                  </div>
                </div>
                <p className="text-slate-600 mb-4 line-clamp-3">{bot.bio}</p>
                <Link 
                  to={bot.bot_id.startsWith('sample-') ? "/signup" : `/chat/${bot.bot_id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {bot.bot_id.startsWith('sample-') ? 'Sign Up to Chat' : 'Start Chat'}
                </Link>
              </div>
            ))}
          </div>
        )}
        
        {/* Show "View All Bots" button if there are more than 6 bots */}
        {!isLoading && featuredBots.length === 6 && featuredBots[0].bot_id !== 'sample-1' && (
          <div className="text-center mt-12">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <Users className="h-5 w-5 mr-2" />
              View All Bots
            </Link>
          </div>
        )}
      </div>

      {/* Community Stats Section (if real bots exist) */}
      {!isLoading && featuredBots.length > 0 && featuredBots[0].bot_id !== 'sample-1' && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{featuredBots.length}+</h3>
                <p className="text-slate-600">AI Companions</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Active</h3>
                <p className="text-slate-600">Community</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">24/7</h3>
                <p className="text-slate-600">Available</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Create Your AI Companion?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of users creating personalized AI experiences</p>
          <Link 
            to="/signup" 
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  );
}