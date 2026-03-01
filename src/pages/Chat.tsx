import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Send, Users, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { BottomNav } from '@/components/BottomNav';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatContact {
  id: string;
  name: string;
  avatar_url?: string;
  child_id: string;
  child_name: string;
  role_label: string;
}

interface ChildOption {
  id: string;
  name: string;
  avatar_emoji: string;
}

type ChatMode = 'private' | 'group';

const MSG_PAGE_SIZE = 50;

const Chat = () => {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [chatMode, setChatMode] = useState<ChatMode>('private');
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [groupChildId, setGroupChildId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const role = activeRole || user?.role;

  // Get children connected to this user
  const { data: myChildren = [] } = useQuery({
    queryKey: ['chat_children', user?.id, role],
    queryFn: async (): Promise<ChildOption[]> => {
      if (!user) return [];
      if (role === 'parent' || role === 'viewer') {
        const { data: own } = await supabase.from('children').select('id, name, avatar_emoji').eq('parent_id', user.id);
        const { data: cv } = await supabase.from('child_viewers').select('child_id').eq('viewer_user_id', user.id);
        const vcIds = (cv || []).map(v => v.child_id);
        let viewerChildren: any[] = [];
        if (vcIds.length > 0) {
          const { data } = await supabase.from('children').select('id, name, avatar_emoji').in('id', vcIds);
          viewerChildren = data || [];
        }
        const all: ChildOption[] = (own || []).map(c => ({ id: c.id, name: c.name, avatar_emoji: c.avatar_emoji || '👶' }));
        for (const vc of viewerChildren) {
          if (!all.find(c => c.id === vc.id)) all.push({ id: vc.id, name: vc.name, avatar_emoji: vc.avatar_emoji || '👶' });
        }
        return all;
      }
      if (role === 'babysitter') {
        const { data: assignments } = await supabase.from('assignments').select('child_id, children(id, name, avatar_emoji)');
        return (assignments || []).map((a: any) => ({
          id: a.children?.id || a.child_id,
          name: a.children?.name || '',
          avatar_emoji: a.children?.avatar_emoji || '👶',
        }));
      }
      return [];
    },
    enabled: !!user,
  });

  // Get contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['chat_contacts', user?.id, role],
    queryFn: async (): Promise<ChatContact[]> => {
      if (!user) return [];
      const result: ChatContact[] = [];
      const seen = new Set<string>();

      if (role === 'parent' || role === 'viewer') {
        // Get own children
        const { data: ownChildren } = await supabase.from('children').select('id, name, avatar_emoji').eq('parent_id', user.id);
        // Get children where user is viewer
        const { data: viewerRecs } = await supabase.from('child_viewers').select('child_id').eq('viewer_user_id', user.id);
        const viewerChildIds = (viewerRecs || []).map(v => v.child_id);
        let viewerChildren: any[] = [];
        if (viewerChildIds.length > 0) {
          const { data } = await supabase.from('children').select('id, name, avatar_emoji').in('id', viewerChildIds);
          viewerChildren = data || [];
        }
        // Merge & deduplicate
        const allChildren: any[] = [...(ownChildren || [])];
        for (const vc of viewerChildren) {
          if (!allChildren.find((c: any) => c.id === vc.id)) allChildren.push(vc);
        }
        if (!allChildren.length) return [];
        const childIds = allChildren.map(c => c.id);
        const childMap: Record<string, string> = {};
        allChildren.forEach(c => { childMap[c.id] = `${c.avatar_emoji || '👶'} ${c.name}`; });

        const { data: assignments } = await supabase.from('assignments').select('child_id, babysitter_user_id').in('child_id', childIds);
        const { data: viewers } = await supabase.from('child_viewers').select('child_id, viewer_user_id').in('child_id', childIds);

        // Also get parent owners of viewer children
        const { data: childDetails } = await supabase.from('children').select('id, parent_id').in('id', childIds);
        const parentOwnerIds = [...new Set((childDetails || []).map(c => c.parent_id))].filter(id => id !== user.id);

        const userIds = [...new Set([
          ...(assignments || []).map(a => a.babysitter_user_id),
          ...(viewers || []).map(v => v.viewer_user_id),
          ...parentOwnerIds,
        ])].filter(id => id !== user.id);
        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        // Add parent owners
        (childDetails || []).forEach(c => {
          if (c.parent_id === user.id) return;
          const key = `${c.parent_id}-${c.id}`;
          if (seen.has(key)) return;
          seen.add(key);
          const p = profileMap[c.parent_id];
          if (p) result.push({ id: c.parent_id, name: p.name || 'Orang Tua', avatar_url: p.avatar_url, child_id: c.id, child_name: childMap[c.id] || '', role_label: 'Orang Tua' });
        });

        (assignments || []).forEach(a => {
          const key = `${a.babysitter_user_id}-${a.child_id}`;
          if (seen.has(key)) return;
          seen.add(key);
          const p = profileMap[a.babysitter_user_id];
          if (p) result.push({ id: a.babysitter_user_id, name: p.name || 'Babysitter', avatar_url: p.avatar_url, child_id: a.child_id, child_name: childMap[a.child_id] || '', role_label: 'Babysitter' });
        });
        (viewers || []).forEach(v => {
          const key = `${v.viewer_user_id}-${v.child_id}`;
          if (seen.has(key) || v.viewer_user_id === user.id) return;
          seen.add(key);
          const p = profileMap[v.viewer_user_id];
          if (p) result.push({ id: v.viewer_user_id, name: p.name || 'Keluarga', avatar_url: p.avatar_url, child_id: v.child_id, child_name: childMap[v.child_id] || '', role_label: 'Keluarga' });
        });
      } else if (role === 'babysitter') {
        const { data: assignments } = await supabase.from('assignments').select('child_id, children(id, name, parent_id, avatar_emoji)');
        if (!assignments?.length) return [];
        const childIds = assignments.map((a: any) => a.child_id);
        const parentIds = [...new Set(assignments.map((a: any) => a.children?.parent_id).filter(Boolean))];
        const { data: viewers } = await supabase.from('child_viewers').select('child_id, viewer_user_id').in('child_id', childIds);
        const userIds = [...new Set([...parentIds, ...(viewers || []).map(v => v.viewer_user_id)])].filter(id => id !== user.id);
        if (userIds.length === 0) return [];

        const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', userIds);
        const profileMap: Record<string, any> = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        assignments.forEach((a: any) => {
          const parentId = a.children?.parent_id;
          if (parentId && parentId !== user.id) {
            const key = `${parentId}-${a.child_id}`;
            if (!seen.has(key)) {
              seen.add(key);
              const p = profileMap[parentId];
              if (p) result.push({ id: parentId, name: p.name || 'Parent', avatar_url: p.avatar_url, child_id: a.child_id, child_name: `${a.children?.avatar_emoji || '👶'} ${a.children?.name || ''}`, role_label: 'Orang Tua' });
            }
          }
        });
        (viewers || []).forEach(v => {
          const key = `${v.viewer_user_id}-${v.child_id}`;
          if (seen.has(key) || v.viewer_user_id === user.id) return;
          seen.add(key);
          const p = profileMap[v.viewer_user_id];
          const child = assignments.find((a: any) => a.child_id === v.child_id)?.children;
          if (p) result.push({ id: v.viewer_user_id, name: p.name || 'Keluarga', avatar_url: p.avatar_url, child_id: v.child_id, child_name: child ? `${child.avatar_emoji || '👶'} ${child.name}` : '', role_label: 'Keluarga' });
        });
      }
      return result;
    },
    enabled: !!user,
  });

  // Filtered contacts by selected child
  const filteredContacts = useMemo(() => {
    if (selectedChild === 'all') return contacts;
    return contacts.filter(c => c.child_id === selectedChild);
  }, [contacts, selectedChild]);

  // Message limit state
  const [privateMsgLimit, setPrivateMsgLimit] = useState(MSG_PAGE_SIZE);
  const [groupMsgLimit, setGroupMsgLimit] = useState(MSG_PAGE_SIZE);

  // Reset limits when switching conversations
  useEffect(() => { setPrivateMsgLimit(MSG_PAGE_SIZE); }, [selectedContact?.id, selectedContact?.child_id]);
  useEffect(() => { setGroupMsgLimit(MSG_PAGE_SIZE); }, [groupChildId]);

  // Private messages
  const { data: privateMessagesRaw = [] } = useQuery({
    queryKey: ['chat_messages', selectedContact?.id, selectedContact?.child_id, privateMsgLimit],
    queryFn: async () => {
      if (!selectedContact) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('child_id', selectedContact.child_id)
        .eq('is_group', false)
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: false })
        .limit(privateMsgLimit);
      if (error) throw error;
      return (data || []).reverse();
    },
    enabled: !!selectedContact,
    refetchInterval: 5000,
  });
  const privateMessages = privateMessagesRaw;
  const hasMorePrivate = privateMessages.length >= privateMsgLimit;

  // Group messages
  const { data: groupMessagesRaw = [] } = useQuery({
    queryKey: ['group_messages', groupChildId, groupMsgLimit],
    queryFn: async () => {
      if (!groupChildId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('child_id', groupChildId)
        .eq('is_group', true)
        .order('created_at', { ascending: false })
        .limit(groupMsgLimit);
      if (error) throw error;
      return (data || []).reverse();
    },
    enabled: !!groupChildId,
    refetchInterval: 5000,
  });
  const groupMessages = groupMessagesRaw;
  const hasMoreGroup = groupMessages.length >= groupMsgLimit;

  // Profile names for group messages
  const groupSenderIds = useMemo(() => [...new Set(groupMessages.map((m: any) => m.sender_id))], [groupMessages]);
  const { data: senderProfiles = {} } = useQuery({
    queryKey: ['sender_profiles', groupSenderIds.sort().join(',')],
    queryFn: async () => {
      if (groupSenderIds.length === 0) return {};
      const { data } = await supabase.from('profiles').select('id, name, avatar_url').in('id', groupSenderIds);
      const map: Record<string, { name: string; avatar_url?: string }> = {};
      (data || []).forEach(p => { map[p.id] = { name: p.name, avatar_url: p.avatar_url || undefined }; });
      return map;
    },
    enabled: groupSenderIds.length > 0,
  });

  const activeMessages = selectedContact ? privateMessages : groupMessages;

  // Realtime for both private and group
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: any) => {
        const row = payload.new || payload.old;
        if (!row) return;
        if (row.is_group && row.child_id === groupChildId) {
          qc.invalidateQueries({ queryKey: ['group_messages', groupChildId] });
        }
        if (!row.is_group && selectedContact) {
          const isRelevant = row.child_id === selectedContact.child_id &&
            ((row.sender_id === user.id && row.receiver_id === selectedContact.id) ||
             (row.sender_id === selectedContact.id && row.receiver_id === user.id));
          if (isRelevant) qc.invalidateQueries({ queryKey: ['chat_messages', selectedContact.id, selectedContact.child_id] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, groupChildId, user, qc]);

  // Mark as read (private only)
  useEffect(() => {
    if (!selectedContact || !user || privateMessages.length === 0) return;
    const unread = privateMessages.filter((m: any) => m.receiver_id === user.id && !m.is_read);
    if (unread.length > 0) {
      supabase.from('messages').update({ is_read: true }).in('id', unread.map((m: any) => m.id)).then();
    }
  }, [privateMessages, selectedContact, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSend = async () => {
    if (!message.trim() || !user || sending) return;
    const text = message.trim();
    setMessage('');
    setSending(true);

    try {
      if (selectedContact) {
        // Private message
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: selectedContact.id,
          child_id: selectedContact.child_id,
          content: text,
          is_group: false,
        });
        const senderName = user.name || 'Seseorang';
        await supabase.from('notifications').insert({
          user_id: selectedContact.id,
          message: `💬 Pesan baru dari ${senderName}: "${text.length > 50 ? text.slice(0, 50) + '...' : text}"`,
        }).then(() => {});
      } else if (groupChildId) {
        // Group message
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: null,
          child_id: groupChildId,
          content: text,
          is_group: true,
        });
      }
    } finally {
      setSending(false);
    }
  };

  const backPath = role === 'parent' ? '/parent/dashboard' : role === 'babysitter' ? '/babysitter/today' : '/viewer/dashboard';
  const inChat = !!selectedContact || !!groupChildId;

  // Chat message view (shared for private & group)
  const renderMessages = (msgs: any[], isGroup: boolean, hasMore: boolean, onLoadMore: () => void) => (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-w-2xl mx-auto w-full">
      {hasMore && (
        <div className="text-center py-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onLoadMore}>
            Muat pesan sebelumnya...
          </Button>
        </div>
      )}
      {msgs.map((m: any) => {
        const isMine = m.sender_id === user!.id;
        const senderName = isGroup && !isMine ? (senderProfiles as any)[m.sender_id]?.name || '...' : null;
        return (
          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
              {senderName && <p className="text-[10px] font-semibold text-primary mb-0.5">{senderName}</p>}
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
  );

  // If inside a chat conversation
  if (inChat) {
    const headerTitle = selectedContact
      ? selectedContact.name
      : `${myChildren.find(c => c.id === groupChildId)?.avatar_emoji || '👶'} ${myChildren.find(c => c.id === groupChildId)?.name || 'Grup'}`;
    const headerSub = selectedContact
      ? `${selectedContact.child_name} · ${selectedContact.role_label}`
      : 'Pesan Utama · Semua anggota';

    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => { setSelectedContact(null); setGroupChildId(null); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {selectedContact?.avatar_url ? (
              <img src={selectedContact.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : !selectedContact ? (
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs"><Users className="h-4 w-4" /></div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs font-bold">
                {selectedContact.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold">{headerTitle}</p>
              <p className="text-[10px] opacity-80">{headerSub}</p>
            </div>
          </div>
        </div>

        {renderMessages(
          selectedContact ? privateMessages : groupMessages,
          !selectedContact,
          selectedContact ? hasMorePrivate : hasMoreGroup,
          () => selectedContact ? setPrivateMsgLimit(prev => prev + MSG_PAGE_SIZE) : setGroupMsgLimit(prev => prev + MSG_PAGE_SIZE)
        )}

        <div className="sticky bottom-0 bg-background border-t px-4 py-3 max-w-2xl mx-auto w-full">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ketik pesan..." className="flex-1 h-11" autoFocus />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!message.trim() || sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Contact list view
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

      <div className="px-4 py-3 max-w-2xl mx-auto space-y-3">
        {/* Child filter */}
        {myChildren.length > 1 && (
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Pilih anak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Anak</SelectItem>
              {myChildren.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Mode tabs */}
        <div className="flex gap-2">
          <Button
            variant={chatMode === 'private' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setChatMode('private')}
          >
            <MessageCircle className="h-4 w-4" /> Pesan Pribadi
          </Button>
          <Button
            variant={chatMode === 'group' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setChatMode('group')}
          >
            <Users className="h-4 w-4" /> Pesan Utama
          </Button>
        </div>

        {chatMode === 'private' ? (
          /* Private contact list */
          <div className="space-y-2">
            {filteredContacts.length === 0 ? (
              <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
                Belum ada kontak.
              </CardContent></Card>
            ) : (
              filteredContacts.map((c, i) => (
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
        ) : (
          /* Group chat list per child */
          <div className="space-y-2">
            {(selectedChild === 'all' ? myChildren : myChildren.filter(c => c.id === selectedChild)).map(child => (
              <Card key={child.id} className="border-0 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setGroupChildId(child.id)}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{child.avatar_emoji} {child.name}</p>
                    <p className="text-xs text-muted-foreground">Grup · Semua anggota</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {myChildren.length === 0 && (
              <Card className="border-0 shadow-sm"><CardContent className="p-6 text-center text-muted-foreground">
                Belum ada anak terdaftar.
              </CardContent></Card>
            )}
          </div>
        )}
      </div>

      <BottomNav role={role === 'babysitter' ? 'babysitter' : 'parent'} />
    </div>
  );
};

export default Chat;
