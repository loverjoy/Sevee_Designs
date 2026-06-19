import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Trash2, Plus, Upload } from 'lucide-react';
import client from '../../api/client';
import { toast } from 'sonner';

interface SpecRow {
  key: string;
  value: string;
}

const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Form Fields State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [modelUrl, setModelUrl] = useState('');
  
  // Image & File States
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);

  // Dynamic Specs state
  const [specs, setSpecs] = useState<SpecRow[]>([
    { key: 'Material', value: 'Mahogany Wood' },
    { key: 'Dimensions', value: '180cm x 90cm x 75cm' },
  ]);

  // Fetch categories and product details if editing
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const catRes = await client.get('/products/categories');
        setCategories(catRes.data);

        if (isEditMode) {
          const prodRes = await client.get(`/products/id/${id}`);
          const p = prodRes.data;
          setName(p.name);
          setCategoryId(p.category_id || '');
          setDescription(p.description || '');
          setPrice(p.price);
          setSalePrice(p.sale_price || '');
          setStockQuantity(p.stock_quantity.toString());
          setIsFeatured(p.is_featured);
          setIsActive(p.is_active);
          setModelUrl(p.model_url || '');
          setImages(p.images || []);
          
          if (p.specifications && Object.keys(p.specifications).length > 0) {
            const rowList = Object.entries(p.specifications).map(([k, v]) => ({
              key: k,
              value: v as string,
            }));
            setSpecs(rowList);
          }
        }
      } catch (error) {
        console.error('Failed to load form details:', error);
        toast.error('Failed to retrieve form setup data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [id, isEditMode]);

  // Handle Specifications Row mutations
  const handleAddSpecRow = () => {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'key' | 'value', value: string) => {
    setSpecs((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  // Handle Image Upload using local API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await client.post('/products/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, res.data.url]);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Image upload failed. Size limit 50MB.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handle 3D Model Upload using local API
  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.usdz')) {
      toast.error('Only .glb or .usdz 3D models are supported!');
      return;
    }

    setUploadingModel(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await client.post('/products/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModelUrl(res.data.url);
      toast.success('3D Model uploaded successfully');
    } catch (error) {
      console.error('Model upload failed:', error);
      toast.error('Model upload failed. Size limit 50MB.');
    } finally {
      setUploadingModel(false);
    }
  };

  // Handle form save submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stockQuantity) {
      toast.error('Name, price, and stock levels are required');
      return;
    }

    setSaving(true);

    // Compile specifications rows to single jsonb object
    const finalSpecifications: Record<string, string> = {};
    specs.forEach((row) => {
      if (row.key.trim() && row.value.trim()) {
        finalSpecifications[row.key.trim()] = row.value.trim();
      }
    });

    const payload = {
      category_id: categoryId || null,
      name,
      description,
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      stock_quantity: parseInt(stockQuantity, 10),
      images,
      specifications: finalSpecifications,
      is_featured: isFeatured,
      is_active: isActive,
      model_url: modelUrl || null,
    };

    try {
      if (isEditMode) {
        await client.put(`/products/${id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await client.post('/products', payload);
        toast.success('Product created successfully!');
      }
      navigate('/admin/products');
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error(error.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 text-center min-h-[50vh] flex flex-col items-center justify-center font-sans">
        <Loader2 className="animate-spin text-accent mb-4" size={32} />
        <p className="text-xs text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Back Button */}
      <Link to="/admin/products" className="inline-flex items-center space-x-2 text-xs text-muted-foreground hover:text-foreground font-semibold uppercase tracking-wider">
        <ArrowLeft size={14} />
        <span>Back to catalog list</span>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold">
          {isEditMode ? `Edit Product: ${name}` : 'Create New Product'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Configure product pricing, specifications, and files</p>
      </div>

      {/* Form Card */}
      <div className="border border-border bg-card p-6 shadow-card">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold border-b border-border pb-2 text-accent">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="E.g. Solid Mahogany Dining Chair"
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the styling, carpentry, wood grain and comfort levels..."
                className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price (GHS) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="E.g. 1500"
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sale Price (GHS, Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="E.g. 1200"
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stock Quantity *</label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                  placeholder="E.g. 10"
                  className="border border-border bg-background p-2.5 text-xs outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Featured product</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span>Active in catalog</span>
              </label>
            </div>
          </div>

          {/* Section 2: Media Files */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif text-base font-bold border-b border-border pb-2 text-accent">Media & Assets</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Images Uploader */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Product Photos</label>
                <div className="border-2 border-dashed border-border p-6 text-center space-y-3 bg-secondary/20 relative">
                  <Upload className="mx-auto text-muted-foreground" size={24} />
                  <div>
                    <p className="text-xs font-semibold">Upload product photos</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, or WEBP up to 50MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center space-x-2 text-xs">
                      <Loader2 className="animate-spin text-accent" size={14} />
                      <span>Uploading photo...</span>
                    </div>
                  )}
                </div>

                {/* Uploaded images display */}
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {images.map((url, idx) => (
                      <div key={idx} className="w-16 h-16 bg-secondary border border-border relative overflow-hidden group shadow-card">
                        <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute inset-0 bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3D Model Uploader */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">3D GLB Model (AR Viewer)</label>
                <div className="border-2 border-dashed border-border p-6 text-center space-y-3 bg-secondary/20 relative">
                  <Upload className="mx-auto text-muted-foreground" size={24} />
                  <div>
                    <p className="text-xs font-semibold">Upload GLB model file</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">GLB model format up to 50MB</p>
                  </div>
                  <input
                    type="file"
                    accept=".glb,.usdz"
                    onChange={handleModelUpload}
                    disabled={uploadingModel}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploadingModel && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center space-x-2 text-xs">
                      <Loader2 className="animate-spin text-accent" size={14} />
                      <span>Uploading model...</span>
                    </div>
                  )}
                </div>

                {/* Model status indicator */}
                {modelUrl && (
                  <div className="bg-success/10 border border-success/20 p-3 text-success text-xs flex items-center justify-between shadow-card">
                    <span className="truncate max-w-[200px]">Model Linked: {modelUrl}</span>
                    <button
                      type="button"
                      onClick={() => setModelUrl('')}
                      className="text-destructive font-bold uppercase tracking-wider text-[10px] underline ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Specifications Builder */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-baseline border-b border-border pb-2">
              <h3 className="font-serif text-base font-bold text-accent">Specifications Builder</h3>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="text-xs text-accent font-bold uppercase tracking-wider flex items-center space-x-1"
              >
                <Plus size={12} />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {specs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No specifications defined. Click Add Row above to add keys like Material or Size.</p>
              ) : (
                <div className="space-y-2.5 max-w-xl">
                  {specs.map((row, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        placeholder="E.g. Material"
                        required
                        className="w-1/2 border border-border bg-background p-2 text-xs outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        placeholder="E.g. Teak Wood"
                        required
                        className="w-1/2 border border-border bg-background p-2 text-xs outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(idx)}
                        className="text-muted-foreground hover:text-destructive p-2"
                        aria-label="Delete row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <Link
              to="/admin/products"
              className="border border-border hover:bg-secondary text-foreground py-2.5 px-6 text-xs font-bold uppercase tracking-wider text-center"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-accent text-primary-foreground py-2.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-card"
            >
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span>Save Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductFormPage;
