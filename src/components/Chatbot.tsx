import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, Package, HelpCircle, Search, Truck } from 'lucide-react';
import client from '../api/client';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  products?: any[];
  order?: any;
}

const getFullImageUrl = (path: string) => {
  if (!path) return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=600';
  if (path.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const serverBase = apiBase.replace(/\/api$/, '');
    return `${serverBase}${path}`;
  }
  return path;
};

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessageBadge, setHasNewMessageBadge] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Auto-pop logic (runs 3 seconds after page loads, only once per session)
  useEffect(() => {
    const hasAutoOpened = sessionStorage.getItem('sevee_chat_auto_opened');
    if (!hasAutoOpened) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('sevee_chat_auto_opened', 'true');
        
        // Add a welcoming bot message on first open
        setMessages([
          {
            role: 'model',
            text: "Hello! I am SeVee, your digital woodwork assistant. How can I help you today? You can ask me to search our catalog, track an order, or learn about our materials.",
          }
        ]);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Load standard welcoming message
      setMessages([
        {
          role: 'model',
          text: "Welcome back! I am SeVee, your digital woodwork assistant. How can I help you today?",
        }
      ]);
    }
  }, []);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Set message badge when new model message arrives while closed
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessageBadge(true);
    }
  }, [messages, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessageBadge(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    // Add user message to state
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      // Build clean history array matching backend expectations
      // Skip the very first welcoming message to avoid confusing history mapping
      const history = newMessages
        .slice(1, -1)
        .map(msg => ({
          role: msg.role,
          text: msg.text
        }));

      const res = await client.post('/chat', {
        message: text,
        history
      });

      const { response, products, order } = res.data;

      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: response,
          products,
          order
        }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          text: "I'm sorry, I encountered a connection issue. Please check your network and try again.",
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    handleSend(prompt);
  };

  // Stepper helper for order tracking
  const renderOrderTracker = (order: any) => {
    if (!order) return null;
    
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentStatus = order.status.toLowerCase();
    const currentStepIndex = steps.indexOf(currentStatus);

    const isCancelledOrRefunded = currentStatus === 'cancelled' || currentStatus === 'refunded';

    return (
      <div className="mt-4 p-4 bg-secondary border border-border space-y-4 text-xs text-foreground font-sans">
        <div className="flex justify-between items-center border-b border-border/60 pb-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Order Number</span>
            <span className="font-bold text-sm tracking-wide">{order.order_number}</span>
          </div>
          <span className={`px-2 py-0.5 font-bold uppercase tracking-wider text-[9px] ${
            isCancelledOrRefunded 
              ? 'bg-destructive/15 text-destructive' 
              : 'bg-accent/15 text-accent'
          }`}>
            {order.status}
          </span>
        </div>

        {isCancelledOrRefunded ? (
          <div className="text-center py-2 text-destructive font-semibold">
            This order has been {currentStatus}. If you have questions, please contact our support team.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Steps Stepper */}
            <div className="flex items-center justify-between relative pt-2">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-border z-0" />
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-accent transition-all duration-500 z-0" 
                style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
              />
              
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center z-10 relative">
                    <div className={`w-5 h-5 flex items-center justify-center border font-bold text-[9px] transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-accent border-accent text-white scale-110 shadow-card' 
                        : isActive 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-card border-border text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`absolute top-6 text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Delivery Info */}
            <div className="pt-6 border-t border-border/40 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-muted-foreground block">Placed On</span>
                <span className="font-semibold">{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Tracking Number</span>
                <span className="font-semibold">{order.tracking_number || 'Pending Dispatch'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground border border-border shadow-hover transition-all duration-300 cursor-pointer flex items-center justify-center rounded-none group"
        aria-label="Open Chatbot Support"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            {hasNewMessageBadge && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent ring-2 ring-background animate-pulse" />
            )}
          </div>
        )}
      </button>

      {/* Chat Window Container */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="fixed bottom-6 right-6 md:bottom-24 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-[380px] h-[calc(100vh-6rem)] md:h-[550px] bg-background/95 backdrop-blur-md border border-border shadow-hover flex flex-col transition-all duration-300 animate-fade-in"
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between border-b border-border/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-sm tracking-wide font-bold">SeVee Assistant</h3>
                <span className="text-[10px] text-muted-foreground/80 tracking-wider uppercase flex items-center">
                  <span className="w-1.5 h-1.5 bg-success mr-1.5" />
                  Online Support
                </span>
              </div>
            </div>
            <button 
              onClick={handleToggle} 
              className="text-primary-foreground/75 hover:text-primary-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg, index) => {
              const isBot = msg.role === 'model';
              return (
                <div key={index} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} space-y-1`}>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {isBot ? 'SeVee Assistant' : 'You'}
                  </span>
                  <div
                    className={`max-w-[85%] px-4 py-3 text-xs leading-relaxed transition-all rounded-none border ${
                      isBot
                        ? 'bg-secondary/45 text-foreground border-border/80'
                        : 'bg-primary text-primary-foreground border-primary'
                    }`}
                  >
                    <p className="whitespace-pre-line font-sans">{msg.text}</p>
                    
                    {/* Render embedded product recommendations */}
                    {isBot && msg.products && msg.products.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/40">
                        {msg.products.map((prod) => {
                          const hasSale = prod.sale_price !== null && prod.sale_price !== undefined;
                          const price = hasSale ? prod.sale_price : prod.price;
                          return (
                            <Link
                              key={prod.id}
                              to={`/product/${prod.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="group bg-card border border-border p-2 hover:border-accent transition-colors flex flex-col space-y-1.5 rounded-none"
                            >
                              <img
                                src={getFullImageUrl(prod.images && prod.images[0])}
                                alt={prod.name}
                                className="w-full aspect-square object-cover"
                              />
                              <h4 className="font-bold text-[10px] truncate group-hover:text-accent transition-colors">{prod.name}</h4>
                              <div className="flex items-center space-x-1.5 text-[9px] font-semibold text-accent">
                                <span>GHS {parseFloat(price as string).toFixed(2)}</span>
                                {hasSale && (
                                  <span className="line-through text-muted-foreground text-[8px]">
                                    GHS {parseFloat(prod.price as string).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Render embedded order tracker */}
                    {isBot && msg.order && renderOrderTracker(msg.order)}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex flex-col items-start space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">SeVee Assistant</span>
                <div className="bg-secondary/45 border border-border/80 px-4 py-3 rounded-none flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Pills (shows when chat has no loading state or is empty) */}
          <div className="px-4 py-2 border-t border-border/40 flex flex-wrap gap-1.5 bg-secondary/15">
            <button
              onClick={() => handleSuggestionClick("Where is my order?")}
              className="px-2.5 py-1 text-[10px] font-sans font-medium tracking-wide border border-border hover:border-accent hover:text-accent bg-background cursor-pointer rounded-none flex items-center space-x-1 transition-colors"
            >
              <Package className="w-3 h-3" />
              <span>Track Order</span>
            </button>
            <button
              onClick={() => handleSuggestionClick("Show me your dining tables")}
              className="px-2.5 py-1 text-[10px] font-sans font-medium tracking-wide border border-border hover:border-accent hover:text-accent bg-background cursor-pointer rounded-none flex items-center space-x-1 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Browse Tables</span>
            </button>
            <button
              onClick={() => handleSuggestionClick("What materials do you use?")}
              className="px-2.5 py-1 text-[10px] font-sans font-medium tracking-wide border border-border hover:border-accent hover:text-accent bg-background cursor-pointer rounded-none flex items-center space-x-1 transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Joinery & Wood</span>
            </button>
            <button
              onClick={() => handleSuggestionClick("How much is shipping to Kumasi?")}
              className="px-2.5 py-1 text-[10px] font-sans font-medium tracking-wide border border-border hover:border-accent hover:text-accent bg-background cursor-pointer rounded-none flex items-center space-x-1 transition-colors"
            >
              <Truck className="w-3 h-3" />
              <span>Delivery Zones</span>
            </button>
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-border flex items-center bg-background"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask SeVee anything..."
              className="flex-grow bg-transparent px-4 py-3.5 text-xs font-sans focus:outline-none placeholder-muted-foreground rounded-none border-0"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3.5 text-primary hover:text-accent disabled:text-muted-foreground transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
