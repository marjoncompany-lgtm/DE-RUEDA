import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, Send, Paperclip, Plus, Search, Users, Shield, Check, X } from 'lucide-react';

export const MessagesView: React.FC = () => {
  const { conversations, messages, currentUser, sendMessage, createConversation } = useApp();

  const [activeConvId, setActiveConvId] = useState(conversations[0]?.conversation_id || 'CONV-001');
  const [inputText, setInputText] = useState('');
  const [searchConv, setSearchConv] = useState('');
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'direct' | 'group'>('group');
  const [attachmentName, setAttachmentName] = useState('');

  const activeConv = conversations.find((c) => c.conversation_id === activeConvId) || conversations[0];
  const activeMessages = messages.filter((m) => m.conversation_id === activeConvId);

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchConv.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachmentName) return;
    sendMessage(activeConvId, inputText.trim(), attachmentName || undefined);
    setInputText('');
    setAttachmentName('');
  };

  const handleCreateConv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = createConversation(newTitle.trim(), newType);
    setActiveConvId(created.conversation_id);
    setIsNewConvOpen(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            De Rueda Messages
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Encrypted Corporate Team Communications</span>
            <span>·</span>
            <span>Field Supervisors & Executive Leadership</span>
          </div>
        </div>

        <button
          onClick={() => setIsNewConvOpen(true)}
          className="px-3 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Channel
        </button>
      </div>

      {/* Messages Hub Container */}
      <div className="bg-[#0e1a16] border border-[#234338] rounded-xl overflow-hidden h-[620px] flex shadow-lg">
        {/* Left: Conversations Sidebar */}
        <div className="w-64 sm:w-72 border-r border-[#234338] flex flex-col bg-[#0e1a16] shrink-0">
          <div className="p-3 border-b border-[#234338]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchConv}
                onChange={(e) => setSearchConv(e.target.value)}
                placeholder="Search channels..."
                className="w-full bg-[#13241f] border border-[#234338] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#234338]/40">
            {filteredConvs.map((c) => {
              const isSelected = c.conversation_id === activeConvId;
              const lastMsg = messages
                .filter((m) => m.conversation_id === c.conversation_id)
                .slice(-1)[0];

              return (
                <button
                  key={c.conversation_id}
                  onClick={() => setActiveConvId(c.conversation_id)}
                  className={`w-full text-left p-3 transition-colors ${
                    isSelected ? 'bg-[#13241f] border-l-2 border-[#a3e635]' : 'hover:bg-[#13241f]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[170px]">{c.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {c.pinned ? '📌' : ''}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">
                    {lastMsg ? lastMsg.text : 'No messages yet'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Active Chat Stream */}
        <div className="flex-1 flex flex-col bg-[#080f0d]">
          {/* Channel Header */}
          <div className="p-3.5 bg-[#0e1a16] border-b border-[#234338] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#13241f] border border-[#234338] flex items-center justify-center text-[#a3e635]">
                {activeConv?.type === 'group' ? <Users className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{activeConv?.title}</div>
                <div className="text-[10px] text-slate-400">Authenticated Internal Channel</div>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeMessages.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-500">
                Start the conversation. All messages are archived to enterprise compliance vaults.
              </div>
            ) : (
              activeMessages.map((msg) => {
                const isMe = currentUser && msg.sender_email === currentUser.email;

                return (
                  <div
                    key={msg.message_id}
                    className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className="text-[10px] text-slate-500 mb-0.5 px-1">
                      <strong className={isMe ? 'text-[#a3e635]' : 'text-emerald-400'}>
                        {msg.sender_name}
                      </strong>{' '}
                      &bull; {msg.created_at?.substring(11, 16) || 'Just now'}
                    </div>

                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#10b981] text-[#080f0d] font-medium rounded-tr-xs'
                          : 'bg-[#13241f] border border-[#234338] text-white rounded-tl-xs'
                      }`}
                    >
                      <div>{msg.text}</div>

                      {msg.attachments && msg.attachments !== '[]' && (
                        <div className="mt-2 pt-2 border-t border-black/10 flex items-center gap-1.5 text-[11px] font-mono">
                          <Paperclip className="w-3 h-3" />
                          <span>Attachment linked</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Composer */}
          <form onSubmit={handleSend} className="p-3 bg-[#0e1a16] border-t border-[#234338] flex items-center gap-2">
            <label className="p-2 text-slate-400 hover:text-white hover:bg-[#13241f] rounded-lg cursor-pointer">
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAttachmentName(file.name);
                }}
              />
            </label>

            {attachmentName && (
              <span className="text-[10px] bg-[#13241f] text-[#a3e635] px-2 py-1 rounded border border-[#234338] flex items-center gap-1">
                {attachmentName}
                <button type="button" onClick={() => setAttachmentName('')} className="hover:text-white">
                  &times;
                </button>
              </span>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message to team... (Enter to send)"
              className="flex-1 bg-[#13241f] border border-[#234338] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
            />

            <button
              type="submit"
              className="px-3.5 py-2 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* New Conversation Modal */}
      {isNewConvOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0e1a16] border border-[#234338] rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#234338] mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#a3e635]" />
                Create New De Rueda Message Channel
              </h2>
              <button onClick={() => setIsNewConvOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConv} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Channel Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                  placeholder="e.g. Site 002 Structural Steel Rigging"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-[#13241f] border border-[#234338] rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="group">Group Channel</option>
                  <option value="direct">Direct 1-on-1</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#234338] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewConvOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-lg hover:bg-[#84cc16]"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
