import { query } from '../db';

export interface GeneratedArticle {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  author: string;
}

export const generateAiArticle = async (): Promise<GeneratedArticle> => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const categories = ["Interior Design", "Sustainability", "Craftsmanship", "Trends", "The Journal"];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  const authors = ["Ama Serwaa Mensah", "Kofi SeVee Mensah", "David Tetteh", "Samuel Boateng"];
  const author = authors[Math.floor(Math.random() * authors.length)];

  const images = [
    "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1507308209625-83c5e2a7629e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800"
  ];
  const image_url = images[Math.floor(Math.random() * images.length)];

  if (!GEMINI_API_KEY) {
    // Generate high quality mock article if no Gemini API Key is loaded
    const mockArticles = [
      {
        title: "The Architecture of Mortise & Tenon Joinery",
        excerpt: "Discover the age-old woodwork technique that eliminates the need for nails or screws in modern furniture.",
        content: `### Structural Artistry in Modern Spaces

At SeVee Designs, we believe that the beauty of a dining table or platform bed goes far deeper than its surface finish. It lies in its structure. Among our core design values is our strict avoidance of metal fasteners, brackets, or plastic dowels. Instead, we rely on **Mortise & Tenon joinery**, a wood joinery technique practiced by craftsmen for thousands of years.

#### What is Mortise & Tenon?

A mortise and tenon joint connects two pieces of wood at a 90-degree angle.
*   **The Tenon:** A protruding tongue cut at the end of a timber member.
*   **The Mortise:** A matching rectangular hole bored into the receiving member.

When joined, these components interlock perfectly. The connection is held together by friction, tight tolerances, and bio-based wood adhesive.

#### Why We Choose Interlocking Joinery
1.  **Lifetime Durability:** Unlike metal screws that can pull loose or rust in West Africa's humid weather, wood-to-wood joinery shifts in harmony with environmental humidity.
2.  **Structural Strength:** The joint distributes weight and tension evenly across the timber fibers, making it significantly stronger than dowel joints.
3.  **Visual Elegance:** The interlocking intersections create beautiful flush edges, illustrating a true union of geometric precision and raw nature.`
      },
      {
        title: "Sourcing Teak Sustainably in West Africa",
        excerpt: "An inside look at our 1-for-1 replanting program and our dedication to preserving Ghana's tropical forests.",
        content: `### Preserving Forests for the Next Generation

As creators of luxury hardwood furniture, SeVee Designs relies on the raw gifts of nature: rich Mahogany, dense Teak, and tactile Rosewood. Yet, we recognize that our craft carries a great responsibility. The tropical forests of West Africa are fragile ecosystems. Without conscious forest management, the legacy of Ghanaian woodwork cannot endure.

#### Sourcing with Precision

We procure all our teak logs from sustainable concessions in the Volta and Ashanti regions. Each tree is carefully selected by our foresters, ensuring that only mature timber is harvested. This selective logging allows the canopy to remain intact, protecting local wildlife and younger saplings.

#### The 1-for-1 Replanting Pledge

For every log of mahogany or teak processed in our East Legon workshop, we fund replanting initiatives in local Ghana reserves.
*   **Replanting Sites:** Local community forest reserves in the Ashanti region.
*   **Tree Varieties:** Indigenous hardwoods including Mahogany, Wawa, and Teak.
*   **Community Impact:** Providing jobs and training to local farmers in agroforestry.

By supporting SeVee Designs, you are active participants in this reforestation cycle. We believe that true luxury is not just defined by design precision, but by ecological integrity.`
      },
      {
        title: "Minimalist Furniture: Styling Your Space",
        excerpt: "Five simple layout strategies to create a balanced, geometric living room using premium hardwoods.",
        content: `### Minimalism is Not the Absence of Something

It is the perfect presence of character. In interior design, styling a room with minimalist wood furniture is about highlighting raw textures, natural light, and clean geometric lines.

Here are five layout guidelines to transform your living room:

#### 1. Let the Wood Breathe
Do not overcrowd your room. If you have a solid wood credenza or coffee table, give it space. Minimalist furniture acts as a sculptural center. Placing other objects too close diminishes its visual weight.

#### 2. Pair Warm Wood with Soft Textures
Balance is key. Counteract the heavy, rigid structure of mahogany or teak with organic fabrics:
*   **Linen curtains** in neutral sand tones.
*   **Bouclé cushions** in off-white or cream.
*   **Sisal rugs** to ground the space.

#### 3. Focus on Light and Shadows
Natural light highlights the subtle oil-rubbed grain of our furniture. Position your dining table or lounge chair near windows to let sunlight catch the matte texture.

#### 4. Keep Surfaces Intentional
Clear the clutter. On your console table, display only two or three selected elements: a ceramic vase, a stack of art books, or a singular brass sculpture.

#### 5. Choose Quality Over Quantity
Investing in a single handcrafted, heirloom-quality table is always better than buying multiple veneer-based items. Minimalist homes rely on furniture built to endure.`
      }
    ];

    const selected = mockArticles[Math.floor(Math.random() * mockArticles.length)];
    const uniqueTitle = `${selected.title} - Vol. ${Math.floor(Math.random() * 1000)}`;
    const slug = uniqueTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    return {
      title: uniqueTitle,
      slug,
      excerpt: selected.excerpt,
      content: selected.content,
      image_url,
      category,
      author
    };
  }

  // Real Gemini API call
  try {
    const prompt = `Write a premium, engaging blog post (around 300-500 words) about modern interior design, furniture crafting, sustainable forestry in West Africa, or styling premium hardwood pieces. 
Return the result strictly in JSON format matching this schema: 
{ "title": "...", "excerpt": "...", "content": "..." } 
Content should be written in beautiful Markdown with multiple headings. Title should be catchy. Do not include markdown wraps around the JSON (such as \`\`\`json or \`\`\`).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${await response.text()}`);
    }

    const data: any = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) throw new Error("No content returned from Gemini");

    const parsed = JSON.parse(textResult.trim());
    const slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();
    
    return {
      title: parsed.title,
      slug,
      excerpt: parsed.excerpt,
      content: parsed.content,
      image_url,
      category,
      author
    };
  } catch (error) {
    console.error("Gemini Generation failed, falling back to mock:", error);
    const fallbackTitle = `Sustainable Woodworking Trends ${Date.now()}`;
    return {
      title: fallbackTitle,
      slug: fallbackTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      excerpt: "Explore the emerging trends in ecological woodworking and sustainable design.",
      content: "### The Growth of Eco-Conscious Design\n\nSustainable design is more than a trend; it is a movement towards preserving our environment while creating beautiful pieces that last a lifetime.",
      image_url,
      category,
      author
    };
  }
};
