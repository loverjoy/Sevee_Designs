import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Calendar, User, ArrowRight } from 'lucide-react';
import client from '../api/client';
import { formatDate } from '../lib/utils';
import useSEO from '../hooks/useSEO';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  author: string;
  published_at: string;
}

const BlogPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return slug ? <BlogDetailPage slug={slug} /> : <BlogListPage />;
};

// Sub-Component 1: List of Blog Posts
const BlogListPage: React.FC = () => {
  useSEO({
    title: 'Design Insights & Inspiration',
    description: 'Explore the latest furniture design trends, architectural insights, solid wood maintenance tips, and craftsmanship stories from SeVee Designs.',
    keywords: 'woodworking blog, furniture design tips, interior styling Accra, solid wood maintenance'
  });

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await client.get('/content/blogs');
        setBlogs(res.data);
      } catch (error) {
        console.error('Failed to load blogs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-xs text-muted-foreground">Loading journal entries...</p>
      </div>
    );
  }

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-12 min-h-[70vh] font-sans">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-4xl font-serif font-bold">The Journal</h1>
        <p className="text-xs text-muted-foreground">
          Stories about wood carpentry, interior configuration ideas, and updates from our Accra joinery workshop.
        </p>
      </div>

      {blogs.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-12">No articles published yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} className="group border border-border bg-card shadow-card hover:shadow-hover transition-all flex flex-col h-full">
              <div className="aspect-[16/10] overflow-hidden bg-secondary border-b border-border">
                <img
                  src={blog.image_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600'}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-[10px] text-muted-foreground uppercase tracking-wider">
                    <span>{blog.category}</span>
                    <span>•</span>
                    <span>{formatDate(blog.published_at)}</span>
                  </div>
                  <Link to={`/blog/${blog.slug}`}>
                    <h4 className="font-serif text-lg font-bold line-clamp-2 group-hover:text-accent transition-colors">
                      {blog.title}
                    </h4>
                  </Link>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{blog.excerpt}</p>
                </div>
                <Link to={`/blog/${blog.slug}`} className="text-[10px] font-sans font-bold text-foreground hover:text-accent uppercase tracking-wider flex items-center space-x-1 pt-2 transition-colors">
                  <span>Read Full Article</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-Component 2: Article Detail Page
interface DetailProps {
  slug: string;
}
const BlogDetailPage: React.FC<DetailProps> = ({ slug }) => {
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: blog ? `${blog.title} | Blog` : 'Loading Article...',
    description: blog ? blog.excerpt : 'Read detailed articles on hardwood design, sustainable sourcing, and modern African carpentry at SeVee Designs.',
    keywords: blog ? `${blog.category}, SeVee Designs, woodworking blog` : 'woodworking blog'
  });

  useEffect(() => {
    const fetchBlogDetail = async () => {
      setLoading(true);
      try {
        const res = await client.get(`/content/blogs/${slug}`);
        setBlog(res.data);
      } catch (error) {
        console.error('Failed to load blog detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-xs text-muted-foreground">Loading article details...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="pt-40 text-center min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-sans">
        <h2 className="font-serif text-2xl font-bold">Article Not Found</h2>
        <Link to="/blog" className="bg-primary text-primary-foreground px-6 py-2.5 text-xs font-bold uppercase tracking-wider">
          Back to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 max-w-3xl mx-auto px-6 space-y-8 min-h-[80vh] font-sans">
      {/* Back Button */}
      <Link to="/blog" className="inline-flex items-center space-x-2 text-xs text-muted-foreground hover:text-foreground font-semibold uppercase tracking-wider">
        <ArrowLeft size={14} />
        <span>Back to journal list</span>
      </Link>

      {/* Article Header */}
      <div className="space-y-4">
        <span className="text-xs text-accent font-bold uppercase tracking-widest block">{blog.category}</span>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight">
          {blog.title}
        </h1>
        
        {/* Author / Date */}
        <div className="flex items-center space-x-6 text-xs text-muted-foreground border-y border-border py-3">
          <div className="flex items-center space-x-1">
            <User size={14} className="text-accent" />
            <span>By <strong>{blog.author}</strong></span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar size={14} className="text-accent" />
            <span>{formatDate(blog.published_at)}</span>
          </div>
        </div>
      </div>

      {/* Main Image */}
      <div className="aspect-[21/10] overflow-hidden bg-secondary border border-border shadow-card">
        <img
          src={blog.image_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000'}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Full Content */}
      <article className="pt-4 border-b border-border pb-12">
        {renderMarkdown(blog.content)}
      </article>
    </div>
  );
};

const renderMarkdown = (text: string) => {
  if (!text) return null;
  
  const blocks = text.split('\n');
  let listItems: React.ReactNode[] = [];
  const renderedElements: React.ReactNode[] = [];
  
  const parseInline = (line: string) => {
    const parts = line.split('**');
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <strong key={idx} className="font-bold text-foreground">{part}</strong>;
      }
      return part;
    });
  };

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 space-y-2 text-xs md:text-sm text-muted-foreground my-4">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  blocks.forEach((line, idx) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('### ')) {
      flushList(idx);
      renderedElements.push(
        <h3 key={idx} className="text-xl md:text-2xl font-serif font-bold text-foreground mt-8 mb-4">
          {parseInline(trimmed.substring(4))}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      flushList(idx);
      renderedElements.push(
        <h4 key={idx} className="text-base md:text-lg font-serif font-bold text-foreground mt-6 mb-3">
          {parseInline(trimmed.substring(5))}
        </h4>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      listItems.push(
        <li key={idx} className="leading-relaxed">
          {parseInline(trimmed.substring(2))}
        </li>
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      const content = trimmed.replace(/^\d+\.\s+/, '');
      listItems.push(
        <li key={idx} className="list-decimal ml-4 leading-relaxed">
          {parseInline(content)}
        </li>
      );
    } else if (trimmed === '') {
      flushList(idx);
    } else {
      flushList(idx);
      renderedElements.push(
        <p key={idx} className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-4">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  flushList(blocks.length);

  return <div className="space-y-1">{renderedElements}</div>;
};

export default BlogPage;
