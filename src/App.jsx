// import "./index.css";
// import { Toaster } from 'react-hot-toast';
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import LoginPage from "./pages/LoginPage";
// import SignupPage from "./pages/SignupPage";
// import ChatPage from "./pages/ChatPage";

// function App() {
//   return (
//     <BrowserRouter>
//       <Toaster position="top-center" reverseOrder={false} />
//       <Routes>
//         <Route path="/" element={<LoginPage />} />
//           <Route path="/login" element={<LoginPage />} />   {/* ✅ Add this */}
//         <Route path="/signup" element={<SignupPage />} />
//         <Route path="/chats" element={<ChatPage />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;
import "./index.css";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ChatPage from "./pages/ChatPage";

function App() {
  const user = JSON.parse(localStorage.getItem("userInfo"));

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Redirect root to login or chats based on auth */}
        <Route path="/" element={user ? <Navigate to="/chats" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/chats" />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/chats" />} />
        <Route path="/chats" element={user ? <ChatPage /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
