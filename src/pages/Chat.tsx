import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string; avatar_url?: string; child_id: string; child_name: string } | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const role = user?.role;

  // Get contacts: parent sees babysitters assigned to their children, babysitter sees parents of assigned children
  const { data: contacts = [] } = useQuery({
    queryKey: ['chat_contacts', user?.id, role],
    queryFn: async () => {
      if (role === 'parent') {
        // Get children, then their assigned babysitters
        const { data: children } = await supabase.from('children').select('id, name').eq('parent_id', user!.id);
        if (!children?.length) return [];
        const childIds = children.map(c => c.id);
        const { data: assignments } = await supabase.from('assignments').select('child_id, babysitter_user_id').in('child_id', childIds);
        if (!assignments?.length) return [];
        const userIds = [...new Set(assignments.map(a => a.babysitter_user_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds);
        const childMap: Record<string, string> = {};
        children.forEach(c => { childMap[c.id] = c.name; });
        return (assignments || []).map(a => {
          const p = (profiles || []).find(pr => pr.id === a.babysitter_user_id);
          return { id: a.babysitter_user_id, name: p?.name || 'Babysitter', avatar_url: p?.avatar_url, child_id: a.child_id, child_name: childMap[a.child_id] || '' };
        });
      } else {
        // Babysitter: get assigned children and their parents
        const { data: assignments } = await supabase.from('assignments').select('child_id, children(id, name, parent_id)');
        if (!assignments?.length) return [];
        const parentIds = [...new Set(assignments.map((a: any) => a.children?.parent_id).filter(Boolean))];
        const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', parentIds);
        return assignments.map((a: any) => {
          const p = (profiles || []).find(pr => pr.id === a.children?.parent_id);
          return { id: a.children?.parent_id, name: p?.name || 'Parent', avatar_url: p?.avatar_url, child_id: a.child_id, child_name: a.children?.name || '' };
        }).filter(c => c.id);
      }
    },
    enabled: !!user,
  });

  // Get messages for selected contact
  const { data: messages = [] } = useQuery({
    queryKey: ['chat_messages', selectedContact?.id, selectedContact?.child_id],
    queryFn: async () => {
      if (!selectedContact) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('child_id', selectedContact.child_id)
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user!.id})`)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedContact,
    refetchInterval: 5000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedContact || !user) return;
    const channel = supabase
      .channel(`chat-${selectedContact.child_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `child_id=eq.${selectedContact.child_id}` }, () => {
        qc.invalidateQueries({ queryKey: ['chat_messages', selectedContact.id, selectedContact.child_id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, user, qc]);

  // Mark as read
  useEffect(() => {
    if (!selectedContact || !user || messages.length === 0) return;
    const unread = messages.filter((m: any) => m.receiver_id === user.id && !m.is_read);
    if (unread.length > 0) {
      supabase.from('messages').update({ is_read: true }).in('id', unread.map((m: any) => m.id)).then();
    }
  }, [messages, selectedContact, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedContact || !user) return;
    const text = message.trim();
    setMessage('');
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedContact.id,
      child_id: selectedContact.child_id,
      content: text,
    });
  };

  const backPath = role === 'parent' ? '/parent/dashboard' : '/babysitter/today';

  // Contact list view
  if (!selectedContact) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(backPath)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">💬 Pesan</h1>
          </div>
        </div>
        <div className="px-4 py-3 space-y-2 max-w-2xl mx-auto">
          {contacts.length === 0 ? (
            <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
              Belum ada kontak. {role === 'parent' ? 'Tambahkan babysitter ke anak Anda dulu.' : 'Anda belum ditugaskan ke anak manapun.'}
            </CardContent></Card>
          ) : (
            contacts.map((c, i) => (
              <Card key={`${c.id}-${c.child_id}-${i}`} className="border-0 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedContact(c)}>
                <CardContent className="p-3 flex items-center gap-3">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">👶 {c.child_name}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setSelectedContact(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {selectedContact.avatar_url ? (
            <img src={selectedContact.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">
              {selectedContact.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold">{selectedContact.name}</p>
            <p className="text-[10px] opacity-80">👶 {selectedContact.child_name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-w-2xl mx-auto w-full">
        {messages.map((m: any) => {
          const isMine = m.sender_id === user!.id;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                <p>{m.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {format(new Date(m.created_at), 'HH:mm', { locale: idLocale })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 bg-background border-t px-4 py-3 max-w-2xl mx-auto w-full">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ketik pesan..." className="flex-1 h-11" autoFocus />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
