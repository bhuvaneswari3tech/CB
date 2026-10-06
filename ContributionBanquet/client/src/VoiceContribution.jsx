import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveContribution } from "./api";
import { applyVoiceInput } from "./voiceParser";
import "./VoiceContribution.css";

const DEFAULT_TRANSCRIPT = "Spoken text will appear here as you speak...";

function VoiceContribution() {
  const navigate = useNavigate();
  const [storedSession] = useState(() =>
    JSON.parse(localStorage.getItem("session") || "null")
  );
  const recognitionRef = useRef(null);
  const activeFieldRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const [language, setLanguage] = useState("ta-IN");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(DEFAULT_TRANSCRIPT);
  const [saving, setSaving] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [billImage, setBillImage] = useState("");
  const [billImageName, setBillImageName] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [form, setForm] = useState({
    name: storedSession?.username || "",
    city: "",
    amount: "",
  });

  useEffect(() => {
    if (!storedSession?.id) {
      navigate("/");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const collectedText = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(", ")
        .trim();

      setTranscript(collectedText || DEFAULT_TRANSCRIPT);

      setForm((prev) =>
        applyVoiceInput(prev, collectedText, activeFieldRef.current)
      );
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language, navigate, storedSession]);

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const startListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    try {
      recognition.lang = language;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const processImageData = async (dataUrl, fileName = "Captured bill image") => {
    let finalDataUrl = dataUrl;

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("The selected image could not be processed."));
      img.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / image.width);
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    finalDataUrl = canvas.toDataURL("image/jpeg", 0.72);

    setBillImage(finalDataUrl);
    setBillImageName(fileName);
    setCameraOpen(false);
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      });
    } catch {
      fileInputRef.current?.click();
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const video = videoRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    processImageData(imageData, "camera-photo.jpg");
    stopCamera();
  };

  const handleBillPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please attach a valid image file or capture a bill photo.");
      event.target.value = "";
      return;
    }

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Unable to read the selected image."));
        reader.readAsDataURL(file);
      });

      if (file.size > 1_200_000) {
        await processImageData(dataUrl, file.name);
      } else {
        setBillImage(dataUrl);
        setBillImageName(file.name);
      }
    } catch (error) {
      alert(error.message || "Unable to process the bill image.");
    }
  };

  const clearBillImage = () => {
    setBillImage("");
    setBillImageName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFieldFocus = (field) => {
    activeFieldRef.current = field;
    setActiveField(field);
  };

  const handleClear = () => {
    activeFieldRef.current = null;
    setActiveField(null);
    setForm({
      name: storedSession?.username || "",
      city: "",
      amount: "",
    });
    setTranscript(DEFAULT_TRANSCRIPT);
    setBillImage("");
    setBillImageName("");
    setIsListening(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    recognitionRef.current?.stop();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.city.trim() || !form.amount) {
      alert("Please fill the contributor name, native place, and amount.");
      return;
    }

    try {
      setSaving(true);

      const response = await saveContribution({
        userId: storedSession?.id,
        functionId: storedSession?.functionId,
        name: form.name.trim(),
        city: form.city.trim(),
        giftAmount: Number(form.amount),
        voiceTranscript: transcript === DEFAULT_TRANSCRIPT ? "" : transcript,
        billImage: billImage || null,
      });

      const contributionId = response?.contribution?.id;
      if (contributionId && billImage) {
        localStorage.setItem(`bill-image-${contributionId}`, billImage);
      }

      navigate("/dashboard");
    } catch (error) {
      alert(error.message || "Unable to save contribution.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="contribution-page">
      <header className="contribution-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-crown">👑</div>
            <div className="brand-name">SPEED MOI</div>
          </div>

          <div className="header-actions">
            <button type="button" onClick={() => navigate("/dashboard")}>Dashboard</button>
            <button type="button" onClick={() => navigate("/dashboard")}>View List</button>
          </div>
        </div>
      </header>

      <main className="contribution-main">
        <div className="contribution-card">
          <div className="page-title">
            <h2>
              Contribution <span>/ பங்களிப்பு</span>
            </h2>
            <p>
              Record your contribution details with voice input.
            </p>
          </div>

          <div className="voice-box">
            <div className="language-row">
              <label htmlFor="language">Voice Language:</label>
              <select id="language" value={language} onChange={handleLanguageChange}>
                <option value="en-US">English (US)</option>
                <option value="ta-IN">தமிழ் (India)</option>
                <option value="en-IN">English (India)</option>
              </select>
            </div>

            <button
              type="button"
              className={`mic-button ${isListening ? "mic-listening" : ""}`}
              onClick={isListening ? stopListening : startListening}
              aria-label={activeField ? `Voice input for ${activeField}` : "Voice input for all fields"}
              title={activeField ? `Speak the ${activeField} value` : "Speak labeled contribution details"}
            >
              🎤
            </button>

            <div className="mic-label">{isListening ? "Listening..." : "Tap to Speak"}</div>

            <div className="transcript-box">
              <span>{transcript}</span>
            </div>
          </div>

          <div className="bill-capture-box">
            <div className="bill-capture-header">
              <span>Bill / Receipt Photo</span>
              <div className="bill-capture-actions">
                <button type="button" className="camera-button" onClick={openCamera}>
                  📷 Camera / Upload
                </button>
                {billImage && (
                  <button type="button" className="remove-bill-button" onClick={clearBillImage}>
                    Remove
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleBillPhotoChange}
              hidden
            />

            {cameraOpen && (
              <div className="camera-modal">
                <div className="camera-panel">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <div className="camera-actions">
                    <button type="button" className="capture-button" onClick={captureCameraPhoto}>
                      Capture Photo
                    </button>
                    <button type="button" className="cancel-camera-button" onClick={stopCamera}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {billImage ? (
              <div className="bill-preview-card">
                <img src={billImage} alt="Contribution bill preview" />
                <small>{billImageName || "Captured bill image"}</small>
              </div>
            ) : (
              <div className="bill-empty-state">
                Attach a bill image or take a photo from the camera.
              </div>
            )}
          </div>

          <form className="contribution-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                Contributor Name <span>*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onFocus={() => handleFieldFocus("name")}
                onChange={handleChange}
                placeholder="e.g. Monica or Ramesh Kumar"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">
                Native Place <span>*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onFocus={() => handleFieldFocus("city")}
                onChange={handleChange}
                placeholder="e.g. Salem or Tiruchengode"
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">
                Amount (₹) <span>*</span>
              </label>
              <div className="amount-wrapper">
                <span>₹</span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="1"
                  value={form.amount}
                  onFocus={() => handleFieldFocus("amount")}
                  onChange={handleChange}
                  placeholder="e.g. 2000"
                />
              </div>
            </div>

            <div className="form-buttons">
              <button type="submit" className="save-button" disabled={saving}>
                {saving ? "Saving..." : "Save Contribution"}
              </button>

              <button type="button" className="clear-button" onClick={handleClear}>
                Clear
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default VoiceContribution;