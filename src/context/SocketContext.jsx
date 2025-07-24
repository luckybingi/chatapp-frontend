import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();
const ENDPOINT = "http://localhost:5000"; // Your backend

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (userInfo) {
      const newSocket = io(ENDPOINT);
      newSocket.emit("setup", userInfo); // ✅ emit setup
      newSocket.on("connected", () => {
        console.log("✅ Socket connected");
      });

      setSocket(newSocket);
    }
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
