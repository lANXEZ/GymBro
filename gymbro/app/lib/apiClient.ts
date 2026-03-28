export const API_BASE_URL = 'http://localhost:3000';

/**
 * 1. Authentication
 */
export async function loginApi(username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Unauthorized');
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Something went wrong. Please try again later.');
  }
  return res.json();
}

/**
 * 2. Save Workout to Database
 */
export async function saveWorkout(token: string, workout_type: string, weight: string, reps: string, date: string) {
  const res = await fetch(`${API_BASE_URL}/api/workout/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ workout_type, weight, reps, date }),
  });
  if (!res.ok) throw new Error('Failed to save workout');
  return res.json();
}

/**
 * 3. Fetch Workout record from Database
 */
export async function fetchWorkout(token: string, workout_type: string, limit: number) {
  const params = new URLSearchParams({ workout_type, limit: limit.toString() });
  const res = await fetch(`${API_BASE_URL}/api/workout/fetch?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('Failed to fetch workout');
  return res.json();
}

/**
 * 4. Workout Struggling Detection
 */
export async function checkIsStruggling(token: string, workout_type: string) {
  const params = new URLSearchParams({ workout_type });
  const res = await fetch(`${API_BASE_URL}/api/workout/is-struggle?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (res.status === 400) throw new Error('Insufficient Data');
  if (!res.ok) throw new Error('Failed to check struggling status');
  return res.json(); // expected boolean or { isStruggling: boolean }
}

/**
 * 5. Generate Image for Sharing
 */
export async function generateShareImage(token: string, weight: string, reps: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ stats: { weight, reps } }),
  });
  if (!res.ok) throw new Error('Failed to generate image');
  return res.blob();
}

/**
 * 6. Payment Processing API
 */
export async function processPayment(token: string, amount: number, source_token: string, currency: string = 'THB') {
  const res = await fetch(`${API_BASE_URL}/api/payment/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, source_token, currency }),
  });
  if (res.status === 400) throw new Error('Bad Request: Invalid token or negative amount');
  if (res.status === 402) throw new Error('Payment Required: Card declined or insufficient funds');
  if (!res.ok) throw new Error('Payment failed');
  return res.json();
}

/**
 * 7. Generate Performance graph image
 */
export async function fetchPerformanceGraph(token: string, workout_type: string, limit: number) {
  const params = new URLSearchParams({ workout_type, limit: limit.toString() });
  const res = await fetch(`${API_BASE_URL}/api/workout/performance-graph?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (res.status === 400) throw new Error('Bad Request: Missing workout_type');
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 404) throw new Error('Not Found: Not enough workout records');
  if (!res.ok) throw new Error('Failed to fetch performance graph');
  return res.blob();
}
