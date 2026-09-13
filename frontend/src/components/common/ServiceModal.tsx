import React, { useState, useEffect } from "react";
import axios from "axios";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated: () => void;
  initialData?: any;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onServiceCreated, initialData }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', categoryId: '', estimatedDurationHours: 1, locationType: 'online'
  });
  const [categories, setCategories] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false); // Added AI loading state

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/categories');
        setCategories(res.data);
      } catch (err) { console.error("Error fetching categories"); }
    };
    if (isOpen) fetchCategories();
    if (initialData) setFormData(initialData);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Added AI enhancement handler function
  const handleAiEnhance = async () => {
    if (!formData.description || formData.description.trim().length < 5) {
      alert("Please write a short description first so the AI has something to improve!");
      return;
    }

    try {
      setIsAiLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post('http://localhost:3000/api/ai/optimize-request', 
        { rawDescription: formData.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = response.data;
      
      setFormData((prev: any) => ({
        ...prev,
        title: data.title || prev.title,
        description: data.enhancedDescription || prev.description,
        // Match category name to categoryId if needed, or leave it intact
      }));
    } catch (error) {
      console.error(error);
      alert("AI assistant is temporarily unavailable. You can still submit your manual description!");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const headers = { headers: { Authorization: `Bearer ${token}` } };
    try {
      if (initialData) await axios.put(`http://localhost:3000/api/services/${initialData._id}`, formData, headers);
      else await axios.post('http://localhost:3000/api/services', formData, headers);
      onServiceCreated();
      onClose();
    } catch (error) { alert("Failed to save service."); }
  };

  return (
    // 'items-start' and 'pt-20' push the modal below your navigation bar
    <div className="fixed inset-0 z-[100] flex justify-center items-start pt-20 pb-4 bg-black/70 overflow-y-auto">
      <div className="bg-[#1a1c24] w-full max-w-lg rounded-2xl p-6 border border-gray-700 shadow-2xl">
        
        <h2 className="text-xl font-bold mb-4 text-white text-left block">
          {initialData ? "Edit Service" : "Create New Service"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">Title</label>
            <input 
              className="w-full p-2.5 bg-[#242731] text-white rounded-lg border border-gray-600 outline-none"
              placeholder="Service Title"
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-400 block">Description</label>
              {/* Added AI Enhance Button here */}
              <button 
                type="button"
                onClick={handleAiEnhance}
                disabled={isAiLoading}
                className="px-2.5 py-0.5 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1 transition"
              >
                {isAiLoading ? '✨ Optimizing...' : '✨ Enhance with AI'}
              </button>
            </div>
            <textarea 
              className="w-full p-2.5 bg-[#242731] text-white rounded-lg border border-gray-600 outline-none h-20"
              placeholder="Describe your service..."
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">Category</label>
            <select 
              className="w-full p-2.5 bg-[#242731] text-white rounded-lg border border-gray-600 outline-none"
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
            >
              <option value="">Select Category</option>
              {categories.map((cat: any) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Hours</label>
              <input 
                type="number" 
                className="w-full p-2.5 bg-[#242731] text-white rounded-lg border border-gray-600 outline-none"
                value={formData.estimatedDurationHours} 
                onChange={(e) => setFormData({...formData, estimatedDurationHours: Number(e.target.value)})} 
              />
            </div>
            <div className="w-1/2">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Location</label>
              <select 
                className="w-full p-2.5 bg-[#242731] text-white rounded-lg border border-gray-600 outline-none"
                value={formData.locationType}
                onChange={(e) => setFormData({...formData, locationType: e.target.value})}
              >
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">
            Publish
          </button>
          <button type="button" onClick={onClose} className="w-full py-1.5 text-gray-500 hover:text-white transition text-sm">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;