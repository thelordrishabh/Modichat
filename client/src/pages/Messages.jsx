import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import { getConversations, getMessages, sendMessage } from "../api";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await getConversations();
        setConversations(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!currentChat) return;
    const fetchMessages = async () => {
      try {
        const { data } = await getMessages(currentChat._id);
        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
    
    // Basic polling for new messages every 3 seconds
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [currentChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      const { data } = await sendMessage({
        conversationId: currentChat._id,
        text: newMessage
      });
      // Add user details so it renders correctly immediately
      const messageWithSender = { ...data, senderId: user };
      setMessages([...messages, messageWithSender]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[75vh] flex flex-col md:flex-row mt-4">
        
        {/* Conversations List */}
        <div className={`${currentChat ? 'hidden md:flex' : 'flex'} md:w-1/3 border-r border-gray-100 dark:border-gray-700 flex-col`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => {
              const otherUser = conv.members.find(m => m._id !== user._id);
              return (
                <div 
                  key={conv._id} 
                  onClick={() => setCurrentChat(conv)}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${currentChat?._id === conv._id ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <Avatar user={otherUser} size="h-12 w-12" textSize="text-xl" />
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {otherUser?.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`${currentChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50/50 dark:bg-gray-800/50`}>
          {currentChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3">
                {(() => {
                  const otherUser = currentChat.members.find(m => m._id !== user._id);
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentChat(null)}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-gray-100 text-lg text-gray-700 dark:bg-gray-700 dark:text-white md:hidden"
                      >
                        ←
                      </button>
                      <Avatar user={otherUser} />
                      <span className="font-semibold text-gray-900 dark:text-white">{otherUser?.name}</span>
                    </>
                  );
                })()}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.map(msg => (
                  <div 
                    key={msg._id} 
                    ref={scrollRef}
                    className={`flex ${msg.senderId._id === user._id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                        msg.senderId._id === user._id 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-600 rounded-bl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-6 py-3 text-gray-900 dark:text-white focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="min-h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4 border-2 border-gray-300 dark:border-gray-600 rounded-full p-6">💬</div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-1">Your Messages</h3>
              <p>Send private photos and messages to a friend or group.</p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
