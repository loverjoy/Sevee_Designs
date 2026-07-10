import React, { useState } from 'react';
import { Mail, Phone, MapPin, Loader2, Send } from 'lucide-react';
import client from '../api/client';
import { toast } from 'sonner';
import useSEO from '../hooks/useSEO';

const ContactPage: React.FC = () => {
  useSEO({
    title: 'Contact Our Accra Workshop',
    description: 'Get in touch with SeVee Designs for inquiries, quotes, custom orders, or showroom visits.',
    keywords: 'contact carpentry Accra, custom wood order Ghana, buy handcrafted tables, SeVee address'
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await client.post('/content/contact', { name, email, phone, subject, message });
      toast.success('Your message has been sent successfully! We will contact you soon.');
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Contact submit failed:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0&q=23+Furniture+Lane,+East+Legon,+Accra,+Ghana`;

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-16 min-h-screen font-sans">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-4xl font-serif font-bold">Contact Our Studio</h1>
        <p className="text-xs text-muted-foreground">
          Reach out for custom size configurations, wholesale requests, or visit our East Legon showroom.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Column: Form & Info */}
        <div className="space-y-8">
          <div className="border border-border bg-card p-6 shadow-card space-y-6">
            <h3 className="font-serif text-lg font-bold border-b border-border pb-3">Send a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="E.g. Kwame Mensah"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="E.g. kwame@example.com"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="E.g. +233244123456"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="E.g. Custom Dining Table Query"
                    className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Tell us about your space, dimensions, or queries..."
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-accent text-primary-foreground py-3 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : (
                  <>
                    <Send size={14} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Contact Details & Embedded Google Maps */}
        <div className="space-y-6">
          <div className="border border-border bg-card p-6 shadow-card space-y-4">
            <h3 className="font-serif text-lg font-bold border-b border-border pb-3">Showroom & Workshop</h3>
            
            <ul className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Accra HQ Studio</p>
                  <p>23 Furniture Lane, East Legon, Accra, Ghana</p>
                  <p className="text-[10px] text-muted-foreground">Open Mon - Sat (9:00 AM - 6:00 PM)</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={18} className="text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Phone Support</p>
                  <p>+233 24 412 3456</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail size={18} className="text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Electronic Inquiries</p>
                  <p>hello@seveedesigns.com</p>
                  <p>orders@seveedesigns.com</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Embedded Google Map */}
          <div className="aspect-[4/3] w-full border border-border shadow-card overflow-hidden">
            <iframe
              title="SeVee Designs East Legon Location Map"
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
