// Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "./api";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleContinue = async (e) => {
    e.preventDefault();

    // Check name
    if (!username.trim()) {
      alert(
        "Please enter your name / உங்கள் பெயரை உள்ளிடவும்"
      );
      return;
    }

    try {
      setLoading(true);

      // Create session using name only
      const data = await createSession(username.trim());

      // Save session
      localStorage.setItem(
        "session",
        JSON.stringify(data.session)
      );

      // Go to voice page
      navigate("/voice");

    } catch (error) {
      console.error(
        "Session error:",
        error
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to connect to the server.\nPlease make sure the backend is running on port 5000.";

      alert(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ================= HEADER ================= */}

      <header className="login-header">

        <div className="header-inner">

          <div className="brand">

            <div className="brand-crown">
              👑
            </div>

            <div className="brand-text">

              <h1>
                SPEED MOI
                <span>
                  {" "} | மொய் விருந்து
                </span>
              </h1>

              <p>
                Digital Contribution Management
              </p>

            </div>

          </div>

          <div className="step-badge">
            Step 1 of 3: Login / உள்நுழைவு
          </div>

        </div>

      </header>

      {/* ================= MAIN ================= */}

      <main className="login-main">

        <div className="login-card">

          {/* Gold top decoration */}

          <div className="card-decoration"></div>

          {/* ================= WELCOME ================= */}

          <div className="welcome-section">

            <div className="welcome-icon">
              🎊
            </div>

            <h2>
              Welcome / நல்வரவு
            </h2>

            <p>
              Enter your name to begin
              managing your contributions.
            </p>

            <p className="tamil-description">
              உங்கள் மொய் விவரங்களை
              நிர்வகிக்க உங்கள் பெயரை
              உள்ளிடவும்.
            </p>

          </div>

          {/* ================= FORM ================= */}

          <form
            className="login-form"
            onSubmit={handleContinue}
          >

            {/* ================= NAME ================= */}

            <div className="form-group">

              <label htmlFor="username">
                👤 Name / பெயர்
              </label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter your name / உங்கள் பெயர்"
                autoComplete="name"
                disabled={loading}
              />

            </div>

            {/* ================= CONTINUE ================= */}

            <button
              type="submit"
              className="continue-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  Continue / தொடரவும்
                  <span className="arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          {/* ================= INFO ================= */}

          <div className="login-note">

            <span className="note-icon">
              💡
            </span>

            <div>

              <strong>
                Note / குறிப்பு:
              </strong>

              <p>
                After login, you can record
                contributions using your voice.
              </p>

              <p className="note-tamil">
                உள்நுழைந்த பிறகு குரல் மூலம்
                மொய் விவரங்களை பதிவு செய்யலாம்.
              </p>

            </div>

          </div>

        </div>

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="login-footer">

        <p>
          © 2026 SPEED MOI
          {" "}•{" "}
          Digital Moi Management System
        </p>

      </footer>

    </div>
  );
}

export default Login;