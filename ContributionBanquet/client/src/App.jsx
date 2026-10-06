import { Routes, Route } from "react-router-dom";

import Login from "./Login";
import VoiceContribution from "./VoiceContribution";
import Dashboard from "./Dashboard";

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/voice"
        element={<VoiceContribution />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

    </Routes>
  );
}

export default App;