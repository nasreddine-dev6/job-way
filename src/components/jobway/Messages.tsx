'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowRight, Users, MessageSquare, Search } from 'lucide-react';
import type { Message } from '@/lib/types';
import { toast } from 'sonner';

interface Conversation {
  userId: string;
  name: string;
  lastMessage?: string;
  lastTime?: string;
  unread: number;
}

export default function MessagesPage() {
  const { user, viewParams, navigate } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(viewParams?.receiverId || null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /* Load all conversations for the current user */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch(`/api/messages?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const msgs: Message[] = data.messages || [];
        // Messages are sorted ascending, so the last message per
        // conversation is the most recent one.
        const convosMap: Record<string, Conversation> = {};
        msgs.forEach((m: Message) => {
          const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
          const otherName = m.senderId === user.id
            ? m.receiver?.name || m.sender?.name || 'مستخدم'
            : m.sender?.name || m.receiver?.name || 'مستخدم';
          if (!convosMap[otherId]) {
            convosMap[otherId] = { userId: otherId, name: otherName, unread: 0 } as Conversation;
          }
          convosMap[otherId].lastMessage = m.content;
          convosMap[otherId].lastTime = m.createdAt;
          if (m.senderId !== user.id && !m.read) convosMap[otherId].unread += 1;
        });
        setConversations(Object.values(convosMap).sort((a, b) =>
          new Date(b.lastTime || 0).getTime() - new Date(a.lastTime || 0).getTime()
        ));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setConversations([]); setLoading(false); toast.error('حدث خطأ أثناء تحميل المحادثات'); } });
    return () => { cancelled = true; };
  }, [user]);

  /* Load the thread for the selected user */
  useEffect(() => {
    if (!selectedUser || !user) return;
    let cancelled = false;
    fetch(`/api/messages?userId=${user.id}&otherId=${selectedUser}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        setMessages(data.messages || []);
        scrollToBottom();
      })
      .catch(() => { if (!cancelled) toast.error('حدث خطأ أثناء تحميل الرسائل'); });

    // Mark the whole conversation as read for the current user
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: selectedUser, receiverId: user.id }),
    }).then(() => {
      setConversations(prev => prev.map(c => c.userId === selectedUser ? { ...c, unread: 0 } : c));
    }).catch(() => {});

    // If this recipient has no conversation yet (e.g. opened via
    // "مراسلة" button), resolve their name from the users API.
    const known = conversations.find(c => c.userId === selectedUser);
    if (!known && !selectedUserName) {
      fetch(`/api/users?action=get&id=${selectedUser}`)
        .then(r => r.json())
        .then(data => { if (!cancelled && data.user?.name) setSelectedUserName(data.user.name); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [selectedUser, user, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: selectedUser,
          applicationId: viewParams?.applicationId || null,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.message) {
        throw new Error(data.error || 'فشل إرسال الرسالة');
      }
      setMessages(prev => [...prev, data.message]);
      scrollToBottom();
      setConversations(prev => {
        const exists = prev.find(c => c.userId === selectedUser);
        if (exists) {
          return prev.map(c =>
            c.userId === selectedUser ? { ...c, lastMessage: content, lastTime: new Date().toISOString() } : c
          );
        }
        // First message in a brand-new conversation
        return [{ userId: selectedUser, name: selectedUserName || 'مستخدم', lastMessage: content, lastTime: new Date().toISOString(), unread: 0 }, ...prev];
      });
    } catch (err: unknown) {
      setNewMessage(content); // restore the text so the user doesn't lose it
      toast.error(err instanceof Error ? err.message : 'فشل إرسال الرسالة');
    }
  };

  const filtered = conversations.filter(c => c.name.includes(search));

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  }

  const selectedConvo = conversations.find(c => c.userId === selectedUser);
  const chatName = selectedConvo?.name || selectedUserName || '';

  return (
    <div className="page-transition max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'SEEKER' ? 'seeker-dashboard' : user?.role === 'COMPANY' ? 'company-dashboard' : 'admin-dashboard')}>
          <ArrowRight className="w-4 h-4 ml-1" /> العودة
        </Button>
        <h1 className="text-2xl font-bold">المحادثات</h1>
      </div>

      <Card className="overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-l border-gray-200 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="بحث في المحادثات..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-9 h-9 text-sm"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center text-gray-400">جارٍ التحميل...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400 text-sm">لا توجد محادثات بعد</p>
                </div>
              ) : (
                filtered.map(conv => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUser(conv.userId)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-right border-b border-gray-50 ${selectedUser === conv.userId ? 'bg-emerald-50 border-r-2 border-r-emerald-500' : ''}`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-emerald-100 text-emerald-600 text-sm font-bold">
                        {conv.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{conv.name}</span>
                        {conv.lastTime && <span className="text-xs text-gray-400">{timeAgo(conv.lastTime)}</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <Badge className="bg-emerald-500 text-white text-xs h-5 min-w-5 flex items-center justify-center rounded-full">
                        {conv.unread}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
            {selectedUser && (selectedConvo || selectedUserName) ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSelectedUser(null)}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-emerald-100 text-emerald-600 text-sm font-bold">
                      {chatName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{chatName}</div>
                    <div className="text-xs text-emerald-500">متصل</div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">ابدأ المحادثة الآن</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map(msg => {
                        const isMine = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMine
                                ? 'bg-emerald-500 text-white rounded-bl-md'
                                : 'bg-gray-100 text-gray-800 rounded-br-md'
                            }`}>
                              {msg.content}
                              <div className={`text-[10px] mt-1 ${isMine ? 'text-emerald-100' : 'text-gray-400'}`}>
                                {timeAgo(msg.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Input
                      placeholder="اكتب رسالتك..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>اختر محادثة لعرضها</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}