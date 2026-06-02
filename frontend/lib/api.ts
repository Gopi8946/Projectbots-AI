const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string | null;
}

export async function api(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Something went wrong' }));
    throw new Error(error.detail || 'API request failed');
  }

  if (response.status === 204) return null;

  return response.json();
}


// ─── AUTH ───────────────────────────────────────────────

export async function registerUser(data: {
  email: string;
  password: string;
  full_name: string;
  company_name?: string;
}) {
  return api('/api/auth/register', { method: 'POST', body: data });
}

export async function loginUser(data: { email: string; password: string }) {
  return api('/api/auth/login', { method: 'POST', body: data });
}

export async function getCurrentUser(token: string) {
  return api('/api/auth/me', { token });
}


// ─── CHATBOTS ───────────────────────────────────────────

export async function getChatbots(token: string) {
  return api('/api/chatbots/', { token });
}

export async function getChatbot(token: string, chatbotId: string) {
  return api(`/api/chatbots/${chatbotId}`, { token });
}

export async function createChatbot(
  token: string,
  data: { name: string; description?: string; personality?: string }
) {
  return api('/api/chatbots/', { method: 'POST', body: data, token });
}

export async function updateChatbot(
  token: string,
  chatbotId: string,
  data: {
    name?: string;
    description?: string;
    system_prompt?: string;
    personality?: string;
    status?: string;
    widget_settings?: Record<string, any>;
  }
) {
  return api(`/api/chatbots/${chatbotId}`, { method: 'PATCH', body: data, token });
}

export async function updateWidgetSettings(
  token: string,
  chatbotId: string,
  settings: Record<string, any>
) {
  return api(`/api/chatbots/${chatbotId}/widget-settings`, {
    method: 'PUT',
    body: settings,
    token,
  });
}

export async function deleteChatbot(token: string, chatbotId: string) {
  return api(`/api/chatbots/${chatbotId}`, { method: 'DELETE', token });
}


// ─── DATA SOURCES ───────────────────────────────────────

export async function getDataSources(token: string, chatbotId: string) {
  return api(`/api/chatbots/${chatbotId}/data-sources/`, { token });
}

export async function uploadDataSourceFile(token: string, chatbotId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_URL}/api/chatbots/${chatbotId}/data-sources/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — browser sets it with FormData boundary automatically
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

export async function addTextDataSource(
  token: string,
  chatbotId: string,
  data: { name: string; content: string }
) {
  return api(`/api/chatbots/${chatbotId}/data-sources/text`, {
    method: 'POST',
    body: data,
    token,
  });
}

export async function deleteDataSource(token: string, chatbotId: string, sourceId: string) {
  return api(`/api/chatbots/${chatbotId}/data-sources/${sourceId}`, {
    method: 'DELETE',
    token,
  });
}


// ─── CHAT ───────────────────────────────────────────────

export async function sendChatMessage(
  token: string,
  chatbotId: string,
  data: { message: string; session_id?: string }
) {
  return api(`/api/chatbots/${chatbotId}/chat/`, {
    method: 'POST',
    body: data,
    token,
  });
}

export async function getChatHistory(token: string, chatbotId: string, sessionId: string) {
  return api(`/api/chatbots/${chatbotId}/chat/history/${sessionId}`, { token });
}

export async function checkChatHealth(token: string, chatbotId: string) {
  return api(`/api/chatbots/${chatbotId}/chat/health`, { token });
}

// ─── PUBLIC API (Widget — no auth needed) ───────────────

export async function getWidgetConfig(apiKey: string) {
  const response = await fetch(`${API_URL}/api/public/config/${apiKey}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Chatbot not found' }));
    throw new Error(error.detail || 'Failed to load config');
  }
  return response.json();
}

export async function sendPublicMessage(apiKey: string, data: { message: string; session_id?: string }) {
  const response = await fetch(`${API_URL}/api/public/chat/${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to send message' }));
    throw new Error(error.detail || 'Chat failed');
  }
  return response.json();
}

// ─── CONVERSATIONS ──────────────────────────────────────

export async function getConversations(token: string, chatbotId: string) {
  return api(`/api/chatbots/${chatbotId}/conversations/`, { token });
}

export async function getConversationDetail(token: string, chatbotId: string, conversationId: string) {
  return api(`/api/chatbots/${chatbotId}/conversations/${conversationId}`, { token });
}

export async function deleteConversation(token: string, chatbotId: string, conversationId: string) {
  return api(`/api/chatbots/${chatbotId}/conversations/${conversationId}`, { method: 'DELETE', token });
}

export async function exportConversationsCSV(token: string, chatbotId: string) {
  const response = await fetch(
    `${API_URL}/api/chatbots/${chatbotId}/conversations/export`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!response.ok) throw new Error('Export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversations_export.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── ANALYTICS ──────────────────────────────────────────

export async function getChatbotAnalytics(token: string, chatbotId: string) {
  return api(`/api/chatbots/${chatbotId}/analytics`, { token });
}


// ─── BILLING ────────────────────────────────────────────

export async function getBillingInfo(token: string) {
  return api('/api/billing/info', { token });
}

export async function createCheckoutSession(token: string, plan: string) {
  return api(`/api/billing/create-checkout?plan=${plan}`, { method: 'POST', token });
}

export async function verifyCheckoutSession(token: string, sessionId: string) {
  return api(`/api/billing/verify-session?session_id=${sessionId}`, { method: 'POST', token });
}

export async function createCustomerPortal(token: string) {
  return api('/api/billing/create-portal', { method: 'POST', token });
}

export async function cancelSubscription(token: string) {
  return api('/api/billing/cancel', { method: 'POST', token });
}

export async function resetUsage(token: string) {
  return api('/api/billing/reset-usage', { method: 'POST', token });
}


// ─── VOICE ──────────────────────────────────────────────

export async function getVoices() {
  return api('/api/voice/voices');
}

export async function updateVoiceSettings(token: string, chatbotId: string, settings: Record<string, any>) {
  return api(`/api/voice/settings/${chatbotId}`, { method: 'PUT', body: settings, token });
}

export async function previewVoice(token: string, text: string, voice: string, speed: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/voice/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, voice, speed }),
  });
  if (!response.ok) throw new Error('Preview failed');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// ─── DOMAIN MANAGEMENT ──────────────────────────────────

export async function updateAllowedDomains(
  token: string,
  chatbotId: string,
  domains: string[]
) {
  return api(`/api/chatbots/${chatbotId}/allowed-domains`, {
    method: 'PUT',
    body: domains,
    token,
  });
}