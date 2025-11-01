import { Routes, Route, Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import StudyBotScreen from "./pages/StudyBot";
import Profile from "./pages/Profile";

export default function App() {
  const { pathname } = useLocation();

  const HIDE_ON = ["/dashboard", "/", "/signup"];

  return (
    <Box>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: "saturate(180%) blur(8px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Aqua Thistle
          </Typography>
          {!HIDE_ON.includes(pathname) && (
            <Typography
              component={Link}
              to="/dashboard"
              sx={{ mr: 2, textDecoration: "none" }}
            >
              Dashboard
            </Typography>
          )}
          {/* <Typography component={Link} to="/login" sx={{ mr: 2, textDecoration: 'none' }}>Login</Typography> */}
          {/* <Typography component={Link} to="/signup" sx={{ textDecoration: 'none' }}>Sign up</Typography> */}
        </Toolbar>
      </AppBar>

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/studybot" element={<StudyBotScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="*" element={<Box p={4}>Not Found</Box>} />
      </Routes>
    </Box>
  );
}
