// api.js
import axios from "axios";

const API_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const createSession = async (username) => {
  const payload = {
    username: username?.trim(),
    functionName: "disease_chat",
  };

  console.log("Creating session with payload:", payload);

  try {
    const response = await api.post("/api/sessions", payload);
    return response.data;
  } catch (error) {
    console.error("Create session error:", error);

    if (error.response) {
      console.error("Server response:", error.response.data);

      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        "Unable to create session"
      );
    }

    if (error.request) {
      throw new Error(
        "Unable to connect to the server. Please make sure the backend is running on port 5000."
      );
    }

    throw new Error(
      "Something went wrong while creating the session."
    );
  }
};

export const saveContribution = async (contribution) => {
  try {
    const response = await api.post(
      "/api/contributions",
      contribution
    );

    return response.data;
  } catch (error) {
    console.error("Save contribution error:", error);

    if (error.response) {
      console.error("Server response:", error.response.data);

      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        "Unable to save contribution"
      );
    }

    if (error.request) {
      throw new Error(
        "Unable to connect to the backend server."
      );
    }

    throw new Error(
      "Something went wrong while saving the contribution."
    );
  }
};

export const getContributions = async () => {
  try {
    const response = await api.get("/api/contributions");

    return response.data;
  } catch (error) {
    console.error("Get contributions error:", error);

    if (error.response) {
      console.error("Server response:", error.response.data);

      throw new Error(
        error.response.data?.error ||
        error.response.data?.message ||
        "Unable to fetch contributions"
      );
    }

    if (error.request) {
      throw new Error(
        "Unable to connect to the backend server."
      );
    }

    throw new Error(
      "Something went wrong while fetching contributions."
    );
  }
};

export const checkBackend = async () => {
  try {
    const response = await api.get("/api/health");

    return response.data;
  } catch (error) {
    console.error("Backend health check error:", error);

    throw new Error(
      "Backend server is not available on port 5000."
    );
  }
};

export default api;