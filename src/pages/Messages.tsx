import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ArrowUpRight, Paperclip, Send, Loader2, File } from 'lucide-react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/ui/EmptyState';
import { goal } from '../lib/analytics';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  // ?to=<userId> : ouvre directement une conversation (bouton « Contacter » d'une fiche).
  const initialContact = searchParams.get('to');
  const [selectedContact, setSelectedContact] = useState<string | null>(
    initialContact && UUID_RE.test(initialContact) ? initialContact : null
  );
  // ?text=… : message pré-rempli (demande de devis depuis une fiche produit).
  const [inputText, setInputText] = useState((searchParams.get('text') || '').slice(0, 1000));
  // ?quote=<produit> : le premier message envoyé est une demande de devis ;
  // l'acheteur choisit de transmettre ou non ses coordonnées au fournisseur.
  const quoteParam = searchParams.get('quote');
  const [quoteProductId, setQuoteProductId] = useState<string | null>(quoteParam && UUID_RE.test(quoteParam) ? quoteParam : null);
  const [shareContact, setShareContact] = useState(false);
  const [filter, setFilter] = useState('');
  const [sendError, setSendError] = useState('');
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
  const visibleConversations = filter.trim()
    ? conversations.filter((c: any) => String(c.name || '').toLowerCase().includes(filter.trim().toLowerCase()))
    : conversations;

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
      const quote = quoteProductId && receiver_id === initialContact ? { quote_product_id: quoteProductId, share_contact: shareContact } : {};
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, receiver_id, ...quote })
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      // Premier message d'une conversation : contact établi avec le fournisseur.
      if (!activeMessages || activeMessages.length === 0) goal('Contact fournisseur');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedContact] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInputText('');
      setSendError('');
      setQuoteProductId(null);
    },
    onError: () => setSendError(t('messages.sendError')),
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
      setSendError(t('messages.uploadError'));
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

      // Le texte vient de l'expéditeur : seuls les liens https sont cliquables.
      if (!/^https:\/\//i.test(fileUrl)) {
        parts.push(match[0]);
        lastIndex = fileRegex.lastIndex;
        continue;
      }
      
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
            <span className="text-xs font-black uppercase truncate max-w-[150px]">{fileName}</span>
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
      <div className="w-full lg:w-96 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="search" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('messages.filter')}
              aria-label={t('messages.filter')}
              className="w-full bg-white ps-10 pe-4 py-3 rounded-xl border border-gray-100 text-xs font-bold focus:outline-none focus:border-secondary transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading && <div className="p-8 text-center text-gray-500 text-sm">{t('messages.loading')}</div>}
          {conversations.length === 0 && !isLoading && (
            <EmptyState className="m-4 border-none !py-8" illustration="messages" title={t('messages.empty')} text={t('emptyStates.messagesText')} />
          )}
          {conversations.length > 0 && visibleConversations.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">{t('messages.noMatch')}</div>
          )}
          {visibleConversations.map((c) => (
            <button 
              key={c.id}
              onClick={() => setSelectedContact(c.id)}
              className={cn(
                "w-full p-6 text-start flex items-start space-x-4 border-b border-gray-50 transition-all",
                selectedContact === c.id ? "bg-secondary text-white" : "hover:bg-gray-50"
              )} 
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center font-black text-primary">
                  {c.name.charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <p className={cn("text-xs font-black uppercase tracking-tight truncate", selectedContact === c.id ? "text-white" : "text-primary")}>
                    {c.name}
                  </p>
                  <span className={cn("text-xs font-bold", selectedContact === c.id ? "text-white/60" : "text-gray-500")}>
                    {c.lastMessage.time}
                  </span>
                </div>
                <p className={cn("text-xs font-medium truncate", selectedContact === c.id ? "text-white/80" : "text-gray-500")}>
                  {c.lastMessage.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        {selectedContact ? (
          <>
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center font-black text-secondary">
                  {conversations.find(c => c.id === selectedContact)?.name.charAt(0) || 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-primary uppercase tracking-tight">
                    {conversations.find(c => c.id === selectedContact)?.name || t('messages.contact')}
                  </h4>
                </div>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto no-scrollbar space-y-8 bg-gray-50/30">
              {activeMessages.map((m) => (
                <div key={m.id} className={cn("flex space-x-4 max-w-[80%]", m.sender === 'me' ? "flex-row-reverse space-x-reverse ms-auto" : "")}>
                  <div className={cn("w-8 h-8 rounded-lg shrink-0", m.sender === 'me' ? "bg-secondary" : "bg-gray-200")} />
                  <div className={cn(
                    "p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm min-w-[120px]",
                    m.sender === 'me' ? "bg-primary text-white rounded-tr-none" : "bg-white text-gray-600 rounded-tl-none border border-gray-100"
                  )}>
                    {renderMessageContent(m.text)}
                    <p className={cn("text-xs font-bold mt-2 uppercase opacity-40", m.sender === 'me' ? "text-end" : "")}>{m.time}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-gray-50">
              {sendError && <p role="alert" className="mb-3 text-xs font-bold text-red-600">{sendError}</p>}
              {quoteProductId && selectedContact === initialContact && (
                <label className="mb-3 flex items-start gap-2 text-xs text-gray-600">
                  <input type="checkbox" checked={shareContact} onChange={(e) => setShareContact(e.target.checked)} className="mt-0.5 h-4 w-4 accent-secondary" />
                  <span>{t('messages.shareContact')}</span>
                </label>
              )}
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
                    aria-label={t('messages.attach')}
                    title={t('messages.attach')}
                    className={cn("p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-center", isUploading && "opacity-50 pointer-events-none")}
                  >
                    {isUploading ? <Loader2 className="h-5 w-5 text-gray-500 animate-spin" /> : <Paperclip className="h-5 w-5 text-gray-500" />}
                  </label>
                </div>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('messages.placeholder')}
                  aria-label={t('messages.placeholder')}
                  className="flex-1 bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                  disabled={sendMessageMutation.isPending || isUploading}
                />
                <button 
                  type="submit"
                  disabled={sendMessageMutation.isPending || (!inputText.trim() && !isUploading)}
                  aria-label={t('messages.send')}
                  className="p-4 bg-primary text-white rounded-2xl hover:bg-secondary disabled:opacity-50 transition-colors"
                >
                  {sendMessageMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-gray-500">
            <Search className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-bold tracking-widest">{t('messages.select')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
