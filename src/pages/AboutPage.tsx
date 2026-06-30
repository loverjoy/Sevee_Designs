import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Leaf, Hammer, Trophy } from 'lucide-react';
import useSEO from '../hooks/useSEO';

const AboutPage: React.FC = () => {
  useSEO({
    title: 'Our Legacy & Wood Craftsmanship',
    description: "Learn about SeVee Designs' decade-long journey of merging modern geometric precision with traditional Ghanaian woodcraft.",
    keywords: 'Ghanaian woodcraft, sustainable forestry, custom carpentry Accra, African furniture design'
  });

  return (
    <div className="pt-32 max-w-7xl mx-auto px-6 space-y-20 min-h-screen font-sans">
      
      {/* 1. Header Hero section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-accent text-xs font-sans font-bold tracking-[0.3em] uppercase block">
            Our Legacy
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight">
            Furniture built for generations
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xl">
            Established in Accra, Ghana, SeVee Designs has spent a decade crafting premium solid wood furniture. We merge architectural, geometric precision with traditional African joinery to create timeless accents for modern spaces.
          </p>
          <div className="pt-2">
            <Link to="/shop" className="bg-primary hover:bg-accent text-primary-foreground py-3.5 px-8 text-xs font-bold uppercase tracking-wider transition-colors inline-block">
              Explore Our Catalog
            </Link>
          </div>
        </div>
        <div className="aspect-[4/3] bg-secondary border border-border overflow-hidden shadow-card">
          <img
            src="https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800"
            alt="Handcrafted Wood joinery detail"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* 2. Core Pillars grid */}
      <section className="space-y-12">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <h2 className="text-3xl font-serif font-bold">Our Design Philosophy</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every dining table, platform bed, and cabinet we manufacture follows a strict set of architectural rules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="border border-border bg-card p-6 shadow-card space-y-4">
            <div className="p-3 bg-accent/10 text-accent inline-block">
              <Hammer size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold">Mortise & Tenon</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We avoid metal nails or plastic dowels where structural joints meet. Our pieces utilize classic interlocking wood joinery, ensuring strength and a lifetime of stability.
            </p>
          </div>

          <div className="border border-border bg-card p-6 shadow-card space-y-4">
            <div className="p-3 bg-accent/10 text-accent inline-block">
              <Compass size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold">Kiln-Dried Hardwoods</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ghana's tropical humidity requires stable timber. Our wood is dried in custom vacuum kilns to optimal moisture percentages to prevent warping, checking, or expanding.
            </p>
          </div>

          <div className="border border-border bg-card p-6 shadow-card space-y-4">
            <div className="p-3 bg-accent/10 text-accent inline-block">
              <Leaf size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold">1-for-1 Replacements</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Environmental stewardship is at the heart of our operations. For every log of mahogany or teak processed in our workshop, we fund replanting initiatives in local Ghana reserves.
            </p>
          </div>

          <div className="border border-border bg-card p-6 shadow-card space-y-4">
            <div className="p-3 bg-accent/10 text-accent inline-block">
              <Trophy size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold">Tactile Matte Finishes</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We reject high-gloss plastic lacquers. Our artisans sand timber to a microscopic smoothness, sealing it with biological oils that highlight wood grains.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Deep Story section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="aspect-[4/3] bg-secondary border border-border overflow-hidden shadow-card order-last lg:order-first">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
            alt="SeVee Designs Custom interior showcase"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-serif font-bold">The East Legon Workshop</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our main studio is located on Furniture Lane in East Legon, Accra. Here, you can watch our master carpenters at work. Combining state-of-the-art timber sawing machines with micro-precise hand planes and chisels, we process teak logs directly from sustainable concessions into structural components.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We are proud to employ 15 local Ghanaian carpenters and designers, keeping traditional craftsmanship alive while pushing the boundaries of modern, minimalist design. When you buy from SeVee, you support Ghanaian forestry, carpentry, and families.
          </p>
          <div className="pt-2">
            <Link to="/contact" className="text-xs font-bold uppercase tracking-wider text-accent border-b border-accent pb-1 hover:text-foreground transition-colors">
              Visit Our Showroom
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Leadership & Team Section */}
      <section className="space-y-12 pb-16 border-t border-border pt-16">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <span className="text-accent text-xs font-sans font-bold tracking-[0.3em] uppercase block">
            Meet the Team
          </span>
          <h2 className="text-3xl font-serif font-bold">Behind SeVee Designs</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The visionary craftspeople, architects, and strategists bringing sustainable African joinery to global homes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {[
            {
              name: 'Ama Serwaa Mensah',
              role: 'Founder & CEO',
              bio: 'Ama drives SeVee’s global vision, establishing international delivery channels and steering our ecological wood restoration program.',
              image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'
            },
            {
              name: 'Kofi SeVee Mensah',
              role: 'Director of Craftsmanship & Master Carpenter',
              bio: 'A third-generation wood artisan, Kofi oversees timber selection, dry vacuum kiln operations, and interlocking structural joinery.',
              image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400'
            },
            {
              name: 'Samuel Boateng',
              role: 'Chief Accountant & Operations Manager',
              bio: 'Samuel manages financial integrity, ensuring our 1-for-1 replanting program funds reach community reserves in the Ashanti region.',
              image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400'
            },
            {
              name: 'David Tetteh',
              role: 'Lead Architect & 3D Product Designer',
              bio: 'David merges physical ergonomics with digital space, designing our catalog and leading WebXR AR visualizations for mobile platforms.',
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
            }
          ].map((member, idx) => (
            <div key={idx} className="border border-border bg-card shadow-card flex flex-col h-full overflow-hidden group hover:border-accent transition-colors duration-300">
              <div className="aspect-[4/5] bg-secondary overflow-hidden relative">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 flex-grow flex flex-col justify-start space-y-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-sans tracking-widest text-muted-foreground uppercase font-bold">
                    {member.role}
                  </span>
                  <h4 className="font-serif text-sm md:text-base font-bold text-foreground group-hover:text-accent transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                    {member.name}
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-sans mt-2">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
