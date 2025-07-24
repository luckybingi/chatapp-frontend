

import toast from 'react-hot-toast';

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const ENDPOINT ="${process.env.VITE_API_URL}";
let socket;

const ChatPage = () => {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupUserSearch, setGroupUserSearch] = useState("");
  const [groupUserSearchResults, setGroupUserSearchResults] = useState([]);

  // For group chat creation modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupUsers, setGroupUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);


  //scheulemsgs
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");


  //ai summary
const [summary, setSummary] = useState("");
const [loadingSummary, setLoadingSummary] = useState(false);


  const navigate = useNavigate();
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      navigate("/login");
      return;
    }

    setUser(userInfo);
    fetchChats(userInfo);

    // Connect socket only once
    if (!socket) {
      socket = io(ENDPOINT);
      socket.emit("setup", userInfo);
      socket.on("connected", () => { });
    }

    const handleMessage = (newMsg) => {
      if (!selectedChat || selectedChat._id !== newMsg.chat._id) return;
      setMessages((prev) => [...prev, newMsg]);
    };

    socket.on("message received", handleMessage);

    // ✅ Cleanup to prevent duplicate listeners
    return () => {
      socket.off("message received", handleMessage);
    };
  }, [navigate, selectedChat]);





  const fetchChats = async (userInfo) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axios.get(`${ENDPOINT}/api/chat`, config);
      setChats(data);
    } catch {
      alert("Failed to load chats");
    }
  };

  const fetchMessages = async (chatId) => {
    if (!user) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get(`${ENDPOINT}/api/message/${chatId}`, config);
      setMessages(data);
      socket.emit("join chat", chatId);
    } catch {
      alert("Failed to load messages");
    }
  };



  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `${ENDPOINT}/api/message`,
        { content: newMessage, chatId: selectedChat._id },
        config
      );
      socket.emit("new message", data);
      setMessages([...messages, data]);
      setNewMessage("");
    } catch {
      alert("Failed to send message");
    }
  };


  const handleScheduleMessage = async () => {
    if (!newMessage.trim() || !scheduledTime) {
      toast.error("Please enter a message and select a time.");
      return;
    }

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        `${ENDPOINT}/api/message/schedule`,
        {
          content: newMessage,
          chatId: selectedChat._id,
          scheduledTime,
        },
        config
      );

      toast.success(
        `✅ Message scheduled for ${new Date(scheduledTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`
      );

      setNewMessage("");
      setScheduledTime("");
      setIsScheduled(false);
    } catch (error) {
      console.error("Schedule error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to schedule message");
    }
  };







  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get(`${ENDPOINT}/api/user?search=${search}`, config);
      setSearchResults(data);
    } catch {
      alert("Search failed");
    }
  };

  const accessChat = async (userId) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`${ENDPOINT}/api/chat`, { userId }, config);
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setSearch("");
      setSearchResults([]);
      fetchMessages(data._id);
    } catch {
      alert("Error accessing chat");
    }
  };

  const renameGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.put(
        `${ENDPOINT}/api/chat/rename`,
        { chatId: selectedChat._id, chatName: newGroupName },
        config
      );
      setSelectedChat(data);
      fetchChats(user);
      setNewGroupName("");
    } catch {
      alert("Rename failed");
    }
  };

  const getSender = (users) => {
    return users.find((u) => u._id !== user._id)?.name || "Unknown";
  };

  const searchGroupUsers = async () => {
    if (!groupUserSearch.trim()) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get(`${ENDPOINT}/api/user?search=${groupUserSearch}`, config);
      setGroupUserSearchResults(data);
    } catch {
      alert("Group user search failed");
    }
  };

  const addUserToGroup = async (userIdToAdd) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.put(
        `${ENDPOINT}/api/chat/groupadd`,
        { chatId: selectedChat._id, userId: userIdToAdd },
        config
      );
      setSelectedChat(data);
      fetchChats(user);
      setGroupUserSearch("");
      setGroupUserSearchResults([]);
    } catch {
      alert("Add user failed");
    }
  };

  const removeUserFromGroup = async (userIdToRemove) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.put(
        `${ENDPOINT}/api/chat/groupremove`,
        { chatId: selectedChat._id, userId: userIdToRemove },
        config
      );
      setSelectedChat(data);
      fetchChats(user);
    } catch {
      alert("Remove user failed");
    }
  };

  const handleGroupUserSearch = async (query) => {
    if (!query) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      const { data } = await axios.get(`${ENDPOINT}/api/user?search=${query}`, config);
      setGroupUserSearchResults(data);
    } catch {
      alert("Group user search failed");
    }
  };

  const toggleUser = (userToAdd) => {
    if (groupUsers.find((u) => u._id === userToAdd._id)) return;
    setGroupUsers([...groupUsers, userToAdd]);
  };


  const removeGroupUser = (userToRemove) => {
    setGroupUsers(groupUsers.filter((u) => u._id !== userToRemove._id));
  };

  
  const handleCreateGroup = async () => {
    if (!groupName.trim() || groupUsers.length === 0) {
      alert("Please fill group name and select users.");
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      const { data } = await axios.post(
        `${ENDPOINT}/api/chat/group`,
        {
          name: groupName,
          users: JSON.stringify(groupUsers.map((u) => u._id)),
        },
        config
      );

      setChats([data, ...chats]);
      setShowGroupModal(false);
      setGroupUsers([]);
      setGroupName("");
    } catch {
      alert("Failed to create group chat");
    }
  };


//ai summary or last 30min
const handleSummarize = async () => {
  try {
    setLoadingSummary(true);

    // ✅ Fetch user from localStorage
    const user = JSON.parse(localStorage.getItem("userInfo"));
    if (!user || !user.token) {
      throw new Error("User not authenticated");
    }

    // ✅ Get 30 min time range
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 60 * 1000);

    // ✅ Make GET request with token
    const { data } = await axios.get(
      `${ENDPOINT}/api/chat/${selectedChat._id}/summary?start=${start.toISOString()}&end=${end.toISOString()}`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`, // ✅ Pass token here
        },
      }
    );

    setSummary(data.summary);
    console.log(data);
    alert("📝 Chat Summary: \n\n" + data.summary);
    setLoadingSummary(false);
  } catch (err) {
    console.error("Summary error:", err.response?.data || err.message);
    alert("❌ Failed to fetch summary");
    setLoadingSummary(false);
  }
};

const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

  return (


<div className="flex flex-col md:flex-row h-screen">

  {/* LEFT SIDEBAR */}
 <div
  className={`w-full md:w-1/3 border-r p-0 overflow-hidden ${
    selectedChat ? "hidden md:block" : "block"
  }`}
  style={{ height: "100vh" }}
>
  {/* Fixed Top Section */}
  <div className="sticky top-0 bg-white z-10 p-4 border-b shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">chatterBox</h2>
      <div className="flex gap-2">
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          onClick={() => setShowGroupModal(true)}
        >
          + Group
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm text-white"
          onClick={() => {
            localStorage.removeItem("userInfo");
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>
    </div>

    <input
      className="w-full px-3 py-2 border rounded mb-2"
      placeholder="Search users to create new chat ..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    <button
      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      onClick={handleSearch}
    >
      Search
    </button>
  </div>

  {/* Scrollable Section for Search Results and Chats */}
  <div className="overflow-y-auto px-4 pb-4" style={{ height: "calc(100vh - 190px)" }}>
    {searchResults.map((u) => (
      <div
        key={u._id}
        className="p-2 mt-2 bg-green-100 rounded cursor-pointer"
        onClick={() => accessChat(u._id)}
      >
        <strong>{u.name}</strong>
        <p className="text-sm text-gray-600">{u.email}</p>
      </div>
    ))}

    {chats.map((chat) => {
      const isSelected = selectedChat?._id === chat._id;
      const displayName = chat.isGroupChat ? chat.chatName : getSender(chat.users);
      const avatarUser = !chat.isGroupChat && chat.users.find((u) => u._id !== user._id);
      const avatarUrl = avatarUser?.pic;

      return (
        <div
          key={chat._id}
          className={`flex items-center gap-3 p-3 mt-2 rounded cursor-pointer shadow ${
            isSelected ? "bg-blue-200" : "bg-gray-100 hover:bg-gray-200"
          }`}
          onClick={() => {
            setSelectedChat(chat);
            fetchMessages(chat._id);
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold text-lg">
              {displayName[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="font-semibold">{displayName}</div>
            <div className="text-sm text-gray-500 truncate">
              {chat.latestMessage?.content || "No messages yet"}
            </div>
          </div>
        </div>
      );
    })}
  </div>

  {/* Modal remains unchanged */}
  {showGroupModal && (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Create Group Chat</h2>
        <input
          type="text"
          className="w-full border px-3 py-2 mb-3 rounded"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <input
          type="text"
          className="w-full border px-3 py-2 mb-2 rounded"
          placeholder="Search users..."
          value={groupUserSearch}
          onChange={(e) => {
            setGroupUserSearch(e.target.value);
            handleGroupUserSearch(e.target.value);
          }}
        />
        <div className="mb-2 flex flex-wrap gap-2">
          {groupUsers.map((u) => (
            <div key={u._id} className="bg-blue-100 px-2 py-1 rounded flex items-center gap-2">
              {u.name}
              <button onClick={() => removeGroupUser(u)} className="text-red-500 font-bold">x</button>
            </div>
          ))}
        </div>
        <div className="max-h-40 overflow-y-auto">
          {groupUserSearchResults.map((u) => (
            <div
              key={u._id}
              className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleUser(u)}
            >
              {u.name} ({u.email})
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={() => setShowGroupModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleCreateGroup}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )}
</div>

   {/* RIGHT CHAT PANEL */}
  <div
  className={`flex-1 flex flex-col ${
    selectedChat ? "block" : "hidden md:flex"
  }`}
  style={{ maxHeight: "100vh" }}
>
    {selectedChat ? (
      <>
        {/* Mobile Back Button */}
        <div className="md:hidden p-3 border-b bg-white">
          <button
            onClick={() => setSelectedChat(null)}
            className="text-sm bg-gray-200 px-3 py-1 rounded"
          >
            ← Back to Chats
          </button>
        </div>

        {/* Chat Header */}
        <div className="p-3 bg-white border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {selectedChat.isGroupChat ? selectedChat.chatName : getSender(selectedChat.users)}
          </h3>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm"
            onClick={handleSummarize}
          >
            Summarize
          </button>
        </div>

        

      


 {selectedChat?.isGroupChat && (
  <div className="bg-gray-100 border-b p-3 text-sm">
    {/* Toggle Button */}
    <button
      className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition duration-200"
      onClick={() => setShowGroupInfo((prev) => !prev)}
    >
      {showGroupInfo ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
          </svg>
          Hide Group Info
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
          Show Group Info
        </>
      )}
    </button>

    {showGroupInfo && (
      <div className="mt-3 space-y-4">
        {/* Rename Group */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="text"
            className="border px-2 py-1 rounded w-full sm:w-auto"
            placeholder="New Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
            onClick={renameGroup}
          >
            Rename
          </button>
        </div>

<div>
  <strong className="block mb-1">Group Members:</strong>
  {selectedChat.users.map((u) => {
    const isAdmin = selectedChat.groupAdmin?._id === u._id;
    const isCurrentUserAdmin = selectedChat.groupAdmin?._id === user._id;

    return (
      <div
        key={u._id}
        className={`flex justify-between items-center mt-1 px-3 py-1 rounded shadow-sm 
        ${isAdmin ? 'bg-green-100 text-green-700 font-semibold' : 'bg-white'}`}
      >
        <div className="flex items-center gap-2">
          <span>{u.name}</span>
          {isAdmin && (
            <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
              Admin
            </span>
          )}
        </div>

        {/* Show remove button only if current user is admin and the user is not themselves */}
        {isCurrentUserAdmin && u._id !== user._id && (
          <button
            className="text-red-600 hover:underline text-sm"
            onClick={() => removeUserFromGroup(u._id)}
          >
            Remove
          </button>
        )}
      </div>
    );
  })}
</div>


        {/* Search & Add Users */}
        <div className="border-t pt-3">
          <div className="mb-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="border px-2 py-1 rounded w-full sm:w-2/3"
              placeholder="Search to add user"
              value={groupUserSearch}
              onChange={(e) => setGroupUserSearch(e.target.value)}
            />
            <button
              className="bg-green-500 text-white px-3 py-1 rounded"
              onClick={searchGroupUsers}
            >
              Search & Add
            </button>
          </div>
          {groupUserSearchResults.map((u) => (
            <div
              key={u._id}
              className="bg-cyan-100 mt-1 px-2 py-1 rounded cursor-pointer hover:bg-cyan-200 transition"
              onClick={() => addUserToGroup(u._id)}
            >
              {u.name} ({u.email})
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {messages.map((msg) => {
            const isSender = msg.sender._id === user._id;
            return (
              <div
                key={msg._id}
                className={`p-2 mb-2 rounded max-w-[70%] shadow ${
                  isSender ? "bg-green-100 ml-auto text-right" : "bg-gray-200"
                }`}
              >
                <div className="text-sm font-semibold">{msg.sender.name}</div>
                <div className="text-sm">{msg.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.createdAt).toLocaleString([], {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Input Bar */}
            {/* Input Box */}
<div className="mt-3 w-full">
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
    <input
      type="text"
      className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
      placeholder="Type your message..."
      value={newMessage}
      onKeyDown={handleKeyDown}
      onChange={(e) => setNewMessage(e.target.value)}
    />

    <button
      onClick={sendMessage}
      className="px-5 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 w-full sm:w-auto"
    >
      Send
    </button>
  </div>

  {/* Toggle for scheduling */}
  <div className="mt-3 flex items-center gap-2">
    <input
      type="checkbox"
      id="scheduleToggle"
      checked={isScheduled}
      onChange={(e) => setIsScheduled(e.target.checked)}
    />
    <label htmlFor="scheduleToggle" className="text-sm">Schedule this message</label>
  </div>

  {/* Schedule time input (only show if checked) */}
  {isScheduled && (
    <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center w-full">
      <input
        type="datetime-local"
        className="border px-3 py-2 rounded text-sm w-full sm:w-auto"
        value={scheduledTime}
        onChange={(e) => setScheduledTime(e.target.value)}
      />

      <button
        onClick={handleScheduleMessage}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm w-full sm:w-auto"
      >
        Send Later
      </button>
    </div>
  )}
</div>

      </>
    ) : (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
        Select or create a chat to start messaging
      </div>
    )}
  </div>

</div>
  )

};

export default ChatPage;







