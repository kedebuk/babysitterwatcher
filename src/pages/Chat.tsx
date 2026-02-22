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
import { BottomNav } from '@/components/BottomNav';

interface ChatContact {
  id: string;
  name: string;
  avatar_url?: string;
  child_id: string;
  child_name: string;
  role_label: string;
}

const Chat = () => {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const role = activeRole || user?.role;

  // Get contacts: only people connected to the same child
  const { data: contacts = [] } = useQuery({
    queryKey: ['chat_contacts', user?.id, role],
    queryFn: async (): Promise<ChatContact[]> => {
      if (!user) return [];
      const result: ChatContact[] = [];
      const seen = new Set<string>();

      if (role === 'parent') {
        // Get MY children only (explicit parent_id filter to avoid admin RLS showing all)
        const { data: children } = await supabase
          .from('children')
          .select('id, name, avatar_emoji')
          .eq('parent_id', user.id);
        if (!children?.length) return [];

        const childIds = children.map(c => c.id);
        const childMap: Record<string, string> = {};
        children.forEach(c => { childMap[c.id] = `${c.avatar_emoji || '👶'} ${c.name}`; });

        // Get babysitters assigned to my children
        const { data: assignments } = await supabase
          .from('assignments')
          .select('child_id, babysitter_user_id')
          .in('child_id', childIds);

        // Get viewers (family) of my children
        const { data: viewers } = await supabase
          .from('child_viewers')
          .select('child_id, viewer_user_id')
          .in('child_id', childIds);

        const userIds = [
          ...new Set([
            ...(assignments || []).map(a => a.babysitter_user_id),
            ...(viewers || []).map(v => v.viewer_user_id),
          ])
        ].filter(id => id !== user.id);

        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        // Add babysitters
        (assignments || []).forEach(a => {
          const key = `${a.babysitter_user_id}-${a.child_id}`;
          if (seen.has(key)) return;
          seen.add(key);
          const p = profileMap[a.babysitter_user_id];
          if (p) {
            result.push({
              id: a.babysitter_user_id,
              name: p.name || 'Babysitter',
              avatar_url: p.avatar_url,
              child_id: a.child_id,
              child_name: childMap[a.child_id] || '',
              role_label: 'Babysitter',
            });
          }
        });

        // Add viewers/family
        (viewers || []).forEach(v => {
          const key = `${v.viewer_user_id}-${v.child_id}`;
          if (seen.has(key)) return;
          seen.add(key);
          const p = profileMap[v.viewer_user_id];
          if (p) {
            result.push({
              id: v.viewer_user_id,
              name: p.name || 'Keluarga',
              avatar_url: p.avatar_url,
              child_id: v.child_id,
              child_name: childMap[v.child_id] || '',
              role_label: 'Keluarga',
            });
          }
        });
      } else if (role === 'babysitter') {
        // Get assigned children and their parents + viewers
        const { data: assignments } = await supabase
          .from('assignments')
          .select('child_id, children(id, name, parent_id, avatar_emoji)');
        if (!assignments?.length) return [];

        const childIds = assignments.map((a: any) => a.child_id);
        const parentIds = [...new Set(assignments.map((a: any) => a.children?.parent_id).filter(Boolean))];

        // Get viewers too
        const { data: viewers } = await supabase
          .from('child_viewers')
          .select('child_id, viewer_user_id')
          .in('child_id', childIds);

        const userIds = [
          ...new Set([
            ...parentIds,
            ...(viewers || []).map(v => v.viewer_user_id),
          ])
        ].filter(id => id !== user.id);

        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        assignments.forEach((a: any) => {
          const parentId = a.children?.parent_id;
          if (parentId && parentId !== user.id) {
            const key = `${parentId}-${a.child_id}`;
            if (!seen.has(key)) {
              seen.add(key);
              const p = profileMap[parentId];
              if (p) {
                result.push({
                  id: parentId,
                  name: p.name || 'Parent',
                  avatar_url: p.avatar_url,
                  child_id: a.child_id,
                  child_name: `${a.children?.avatar_emoji || '👶'} ${a.children?.name || ''}`,
                  role_label: 'Orang Tua',
                });
              }
            }
          }
        });

        // Add viewers
        (viewers || []).forEach(v => {
          const key = `${v.viewer_user_id}-${v.child_id}`;
          if (seen.has(key) || v.viewer_user_id === user.id) return;
          seen.add(key);
          const p = profileMap[v.viewer_user_id];
          const child = assignments.find((a: any) => a.child_id === v.child_id)?.children;
          if (p) {
            result.push({
              id: v.viewer_user_id,
              name: p.name || 'Keluarga',
              avatar_url: p.avatar_url,
              child_id: v.child_id,
              child_name: child ? `${child.avatar_emoji || '👶'} ${child.name}` : '',
              role_label: 'Keluarga',
            });
          }
        });
      }

      return result;
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
      <div className="min-h-screen pb-16">
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
              Belum ada kontak. {role === 'parent' ? 'Tambahkan babysitter atau keluarga ke anak Anda dulu.' : 'Anda belum ditugaskan ke anak manapun.'}
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
                    <p className="text-xs text-muted-foreground">{c.child_name}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">{c.role_label}</span>
                </CardContent>
              </Card>
          ))
          )}
        </div>

        <BottomNav role={role === 'babysitter' ? 'babysitter' : 'parent'} />
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
            <p className="text-[10px] opacity-80">{selectedContact.child_name} · {selectedContact.role_label}</p>
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