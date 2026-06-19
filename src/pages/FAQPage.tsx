import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import client from '../api/client';
import useSEO from '../hooks/useSEO';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

const FAQPage: React.FC = () => {
  useSEO({
    title: 'Frequently Asked Questions',
    description: 'Find answers about shipping, custom hardwood selections, wood care, Accra showroom visits, and warranties.',
    keywords: 'FAQ Accra furniture, wood care tips, custom table design questions, shipping Accra'
  });

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await client.get('/content/faqs');
        setFaqs(res.data);
      } catch (error) {
        console.error('Failed to load FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Group FAQs by category
  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  return (
    <div className="pt-32 max-w-4xl mx-auto px-6 space-y-10 min-h-[70vh] font-sans">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-4xl font-serif font-bold">Frequently Asked Questions</h1>
        <p className="text-xs text-muted-foreground">
          Find quick answers about material quality, shipping fees, custom adjustments, and using our 3D AR viewer.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="animate-spin text-accent" size={32} />
          <span className="text-xs text-muted-foreground">Loading FAQs...</span>
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-12">No FAQs configured yet.</p>
      ) : (
        <div className="space-y-12">
          {categories.map((category) => (
            <div key={category} className="space-y-4">
              {/* Category Subheading */}
              <h3 className="font-serif text-lg font-bold border-b border-border pb-2 text-accent">
                {category} Questions
              </h3>
              
              {/* FAQs in Category */}
              <div className="space-y-3">
                {faqs
                  .filter((f) => f.category === category)
                  .map((faq) => {
                    const isOpen = expandedId === faq.id;
                    return (
                      <div key={faq.id} className="border border-border bg-card shadow-card">
                        <button
                          onClick={() => toggleExpand(faq.id)}
                          className="w-full text-left p-4 flex justify-between items-center gap-4 hover:bg-secondary/20 transition-colors"
                        >
                          <span className="text-xs font-bold text-foreground flex items-center space-x-2">
                            <HelpCircle size={14} className="text-accent shrink-0" />
                            <span>{faq.question}</span>
                          </span>
                          {isOpen ? (
                            <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="p-4 border-t border-border bg-background/50 text-xs text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FAQPage;
