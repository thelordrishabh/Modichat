import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import GlobalFeed from "./pages/GlobalFeed";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import EditProfile from "./pages/EditProfile";
import PostDetail from "./pages/PostDetail";
import Chat from "./pages/Chat";
import Trending from "./pages/Trending";
import HashtagPage from "./pages/HashtagPage";
import LiveStream from "./pages/LiveStream";
import WatchLive from "./pages/WatchLive";
import Events from "./pages/Events";
import Settings from "./pages/Settings";
import GlobalExperience from "./components/GlobalExperience";

const MotionDiv = motion.div;

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <>
      <GlobalExperience />
      <AnimatePresence mode="wait">
        <MotionDiv
          key={location.pathname}
          className="page-cinema-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<GlobalFeed />} />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/trending" element={<ProtectedRoute><Trending /></ProtectedRoute>} />
            <Route path="/hashtag/:tag" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LiveStream /></ProtectedRoute>} />
            <Route path="/watch-live" element={<ProtectedRoute><WatchLive /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </MotionDiv>
      </AnimatePresence>
      <MotionDiv
        key={`wipe-${location.pathname}`}
        className="cinematic-wipe"
        initial={{ scaleX: 1, transformOrigin: "left" }}
        animate={{ scaleX: 0, transformOrigin: "right" }}
        transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
        aria-hidden="true"
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <Toaster position="top-center" />
              <AnimatedRoutes />
            </BrowserRouter>
          </NotificationsProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
