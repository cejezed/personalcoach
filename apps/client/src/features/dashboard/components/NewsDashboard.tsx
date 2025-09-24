import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Clock, Car, Bot, Globe, AlertCircle } from 'lucide-react';

type NewsItem = {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
};

type NewsTab = 'general' | 'automotive' | 'ai-video';

const NewsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NewsTab>('general');
  const [news, setNews] = useState<Record<NewsTab, NewsItem[]>>({
    general: [],
    automotive: [],
    'ai-video': []
  });
  const [loading, setLoading] = useState<Record<NewsTab, boolean>>({
    general: false,
    automotive: false,
    'ai-video': false
  });
  const [error, setError] = useState<Record<NewsTab, string | null>>({
    general: null,
    automotive: null,
    'ai-video': null
  });
  const [lastUpdated, setLastUpdated] = useState<Record<NewsTab, Date | null>>({
    general: null,
    automotive: null,
    'ai-video': null
  });

  const tabs = [
    { 
      id: 'general' as NewsTab, 
      label: 'Algemeen Nieuws', 
      icon: Globe,
      description: 'Laatste Nederlandse nieuws'
    },
    { 
      id: 'automotive' as NewsTab, 
      label: 'Auto Nieuws', 
      icon: Car,
      description: 'Auto-industrie en motorsport'
    },
    { 
      id: 'ai-video' as NewsTab, 
      label: 'AI Video/Image', 
      icon: Bot,
      description: 'AI video en beeldgeneratie'
    }
  ];

  // API configuration
  const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
  
  const fetchNews = async (category: NewsTab): Promise<NewsItem[]> => {
    setLoading(prev => ({ ...prev, [category]: true }));
    setError(prev => ({ ...prev, [category]: null }));

    try {
      let query = '';
      let sources = '';
      
      switch (category) {
        case 'general':
          query = 'Nederland OR Dutch OR Amsterdam OR "Den Haag"';
          sources = 'nu.nl,nos.nl';
          break;
        case 'automotive':
          query = 'automotive OR cars OR Tesla OR BMW OR Formula 1 OR electric vehicle';
          break;
        case 'ai-video':
          query = 'AI video OR "artificial intelligence" video OR "AI image generation" OR OpenAI OR Runway OR Midjourney OR "text to video"';
          break;
      }

      // Using NewsAPI - you'll need to get a free API key from https://newsapi.org
      const baseUrl = 'https://newsapi.org/v2/everything';
      const params = new URLSearchParams({
        apiKey: NEWS_API_KEY || 'demo-key',
        q: query,
        language: category === 'general' ? 'nl' : 'en',
        sortBy: 'publishedAt',
        pageSize: '10',
        ...(sources && { sources })
      });

      const response = await fetch(`${baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(data.message || 'API error');
      }

      if (!Array.isArray(data.articles)) {
        throw new Error('Nieuwsdata is ongeldig of niet beschikbaar.');
      }

      const articles: NewsItem[] = data.articles.map((article: any, index: number) => ({
        id: `${category}-${index}-${Date.now()}`,
        title: article.title,
        summary: article.description || article.content?.substring(0, 150) + '...' || '',
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        imageUrl: article.urlToImage
      }));

      setLastUpdated(prev => ({ ...prev, [category]: new Date() }));
      return articles;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis bij het ophalen van het nieuws';
      setError(prev => ({ ...prev, [category]: errorMessage }));
      
      // Fallback to mock data if API fails
      return getFallbackNews(category);
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  // Fallback news when API is unavailable
  const getFallbackNews = (category: NewsTab): NewsItem[] => {
    const fallbackData = {
      general: [
        {
          id: 'fallback-1',
          title: 'Nieuws tijdelijk niet beschikbaar',
          summary: 'De nieuws-API is momenteel niet beschikbaar. Probeer later opnieuw.',
          url: '#',
          publishedAt: new Date().toISOString(),
          source: 'Systeem',
        }
      ],
      automotive: [
        {
          id: 'fallback-2', 
          title: 'Auto nieuws tijdelijk niet beschikbaar',
          summary: 'Het auto nieuws kan momenteel niet worden opgehaald. Controleer je internetverbinding.',
          url: '#',
          publishedAt: new Date().toISOString(),
          source: 'Systeem',
        }
      ],
      'ai-video': [
        {
          id: 'fallback-3',
          title: 'AI nieuws tijdelijk niet beschikbaar', 
          summary: 'Het AI/video nieuws is momenteel niet beschikbaar. Probeer over enkele minuten opnieuw.',
          url: '#',
          publishedAt: new Date().toISOString(),
          source: 'Systeem',
        }
      ]
    };
    
    return fallbackData[category];
  };

  const loadNews = async (category: NewsTab) => {
    const articles = await fetchNews(category);
    setNews(prev => ({ ...prev, [category]: articles }));
  };

  const refreshNews = () => {
    loadNews(activeTab);
  };

  // Load news when tab changes
  useEffect(() => {
    if (news[activeTab].length === 0) {
      loadNews(activeTab);
    }
  }, [activeTab]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (news[activeTab].length > 0) {
        loadNews(activeTab);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const publishedAt = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min geleden`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} uur geleden`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} dagen geleden`;
    }
  };

  return (
    <div className="bg-card rounded-2xl border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">Nieuws Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Blijf op de hoogte van de laatste ontwikkelingen</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated[activeTab] && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                Bijgewerkt: {lastUpdated[activeTab]!.toLocaleTimeString('nl-NL', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
            <button
              onClick={refreshNews}
              disabled={loading[activeTab]}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading[activeTab] ? 'animate-spin' : ''}`} />
              Vernieuwen
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {loading[tab.id] && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {error[activeTab] && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-destructive">Nieuws tijdelijk niet beschikbaar</h3>
              <p className="text-sm text-destructive/80 mt-1">
                {error[activeTab]}
                {!NEWS_API_KEY && (
                  <span className="block mt-2">
                    <strong>Tip:</strong> Voeg een NEWS_API_KEY toe aan je environment variabelen voor live nieuws.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {loading[activeTab] && news[activeTab].length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="w-24 h-16 bg-muted rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {news[activeTab].map((article) => (
              <article
                key={article.id}
                className="flex space-x-4 p-4 rounded-lg border border-border hover:border-border/80 hover:bg-accent/50 transition-all"
              >
                {article.imageUrl && (
                  <div className="w-24 h-16 flex-shrink-0">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium text-card-foreground line-clamp-2 pr-2">
                      {article.title}
                    </h3>
                    {article.url !== '#' && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  {article.summary && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{article.source}</span>
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading[activeTab] && news[activeTab].length === 0 && !error[activeTab] && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">Geen nieuws gevonden</h3>
            <p className="text-muted-foreground">Probeer later opnieuw of ververs de pagina.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-muted/20 rounded-b-2xl">
        <p className="text-xs text-muted-foreground text-center">
          Nieuws wordt automatisch iedere 15 minuten bijgewerkt • 
          {!NEWS_API_KEY && ' Demo modus - configureer NEWS_API_KEY voor live nieuws'}
        </p>
      </div>
    </div>
  );
};

export default NewsDashboard;