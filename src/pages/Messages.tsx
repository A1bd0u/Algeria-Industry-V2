import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Phone, Video, Info, FileText, ArrowUpRight, Paperclip, Send, Loader2, File } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  sender: 'me' | 'them';
  time: string;
}

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: conversations = [], isLoading: isLoadingConvos } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/messages/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    refetchInterval: 15000,
  });

  const { data: activeMessages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', selectedContact],
    queryFn: async () => {
      if (!selectedContact) return [];
      const res = await fetch(`/api/messages/${selectedContact}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!selectedContact,
    refetchInterval: 5000, // Polling frequent for active chat
  });

  const isLoading = isLoadingConvos || isLoadingMessages;

  useEffect(() => {
    if (!selectedContact && conversations.length > 0) {
      setSelectedContact(conversations[0].id);
    }
  }, [conversations, selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, receiver_id }: { text: string, receiver_id: string | null }) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, receiver_id })
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedContact] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInputText('');
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !isUploading) return;
    sendMessageMutation.mutate({ 
      text: inputText, 
      receiver_id: selectedContact === 'general' ? null : selectedContact 
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload?bucket=product-images', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      const fileUrl = data.url;
      const fileName = file.name;
      
      const attachmentText = `\n[Fichier: ${fileName}](${fileUrl})`;
      
      sendMessageMutation.mutate({
        text: inputText ? inputText + attachmentText : attachmentText,
        receiver_id: selectedContact === 'general' ? null : selectedContact
      });
      
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload du fichier");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const renderMessageContent = (text: string) => {
    const fileRegex = /\[Fichier: (.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = fileRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const fileName = match[1];
      const fileUrl = match[2];
      
      parts.push(
        <a 
          key={match.index} 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 p-3 bg-white/10 border border-current/10 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/20 transition-all block w-full"
        >
          <div className="flex items-center space-x-3">
            <File className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase truncate max-w-[150px]">{fileName}</span>
          </div>
          <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-all" />
        </a>
      );
      
      lastIndex = fileRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key="end">{text.substring(lastIndex)}</span>);
    }

    return <div className="whitespace-pre-wrap">{parts}</div>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col lg:flex-row gap-6 h-[700px]"
    >
      <div className="w-full lg:w-96 bg-white border border-gray-100 rounded-[32px] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filtrer messages..."
              className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-xs font-bold focus:outline-none focus:border-secondary transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading && <div className="p-8 text-center text-gray-400 text-sm">Chargement...</div>}
          {conversations.length === 0 && !isLoading && (
            <div className="p-8 text-center text-gray-400 text-sm">Aucune conversation</div>
          )}
          {conversations.map((c, i) => (
            <button 
              key={c.id}
              onClick={() => setSelectedContact(c.id)}
              className={cn(
                "w-full p-6 text-left flex items-start space-x-4 border-b border-gray-50 transition-all",
                selectedContact === c.id ? "bg-secondary text-white" : "hover:bg-gray-50"
              )} 
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center font-black text-primary">
                  {c.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-white rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className={cn("text-xs font-black uppercase tracking-tight truncate", selectedContact === c.id ? "text-white" : "text-primary")}>
                    {c.name}
                  </p>
                  <span className={cn("text-[9px] font-bold", selectedContact === c.id ? "text-white/60" : "text-gray-400")}>
                    {c.lastMessage.time}
                  </span>
                </div>
                <p className={cn("text-[10px] font-medium truncate", selectedContact === c.id ? "text-white/80" : "text-gray-500")}>
                  {c.lastMessage.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-100 rounded-[32px] overflow-hidden flex flex-col shadow-xl">
        {selectedContact ? (
          <>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center font-black text-secondary">
                  {conversations.find(c => c.id === selectedContact)?.name.charAt(0) || 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-primary uppercase tracking-tight">
                    {conversations.find(c => c.id === selectedContact)?.name || 'Contact'}
                  </h4>
                  <p className="text-[9px] font-bold text-success uppercase">En ligne maintenant</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-primary transition-all"><Phone className="h-4 w-4" /></button>
                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-primary transition-all"><Video className="h-4 w-4" /></button>
                <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-primary transition-all"><Info className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8 bg-gray-50/30">
              {activeMessages.map((m) => (
                <div key={m.id} className={cn("flex space-x-4 max-w-[80%]", m.sender === 'me' ? "flex-row-reverse space-x-reverse ml-auto" : "")}>
                  <div className={cn("w-8 h-8 rounded-lg shrink-0", m.sender === 'me' ? "bg-secondary" : "bg-gray-200")} />
                  <div className={cn(
                    "p-4 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm min-w-[120px]",
                    m.sender === 'me' ? "bg-primary text-white rounded-tr-none" : "bg-white text-gray-600 rounded-tl-none border border-gray-100"
                  )}>
                    {renderMessageContent(m.text)}
                    <p className={cn("text-[8px] font-bold mt-2 uppercase opacity-40", m.sender === 'me' ? "text-right" : "")}>{m.time}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-gray-50">
              <form onSubmit={handleSend} className="flex items-center space-x-4">
                <div className="relative">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className={cn("p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center", isUploading && "opacity-50 pointer-events-none")}
                  >
                    {isUploading ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" /> : <Paperclip className="h-5 w-5 text-gray-400" />}
                  </label>
                </div>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Écrivez votre message..." 
                  className="flex-1 bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  disabled={sendMessageMutation.isPending || isUploading}
                />
                <button 
                  type="submit"
                  disabled={sendMessageMutation.isPending || (!inputText.trim() && !isUploading)}
                  className="p-4 bg-primary text-white rounded-2xl hover:bg-secondary disabled:opacity-50 transition-colors"
                >
                  {sendMessageMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-gray-400">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
