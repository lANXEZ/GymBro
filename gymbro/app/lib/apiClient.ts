export const API_BASE_URL = '';

/**
 * Global 401 interceptor.
 *
 * Any fetch call that carries an `Authorization: Bearer <token>` header and
 * receives a 401 dispatches a window-level `auth:expired` event. The app's
 * auth layer listens for this to show a re-login prompt. Unauthenticated
 * 401s (e.g. wrong password on /api/login) are NOT intercepted.
 */
if (typeof window !== 'undefined' && !(window as any).__gbFetchPatched) {
  (window as any).__gbFetchPatched = true;
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await origFetch(input as any, init);
    if (res.status === 401) {
      const headers: any = init?.headers || {};
      const hasAuth = headers?.Authorization
        || headers?.authorization
        || (headers instanceof Headers && (headers.get('Authorization') || headers.get('authorization')));
      if (hasAuth) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }
    return res;
  };
}

export async function checkUsernameApi(username: string): Promise<{ available: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/user/check-username?username=${encodeURIComponent(username)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to check username');
  }
  return res.json();
}

export async function sendExerciseApi(token: string, exMoveId: number, receiver_id: number, receiver_username: string) {
  const res = await fetch(`${API_BASE_URL}/api/workout/exercise/${exMoveId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ receiver_id, receiver_username })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send exercise');
  }
  return res.json();
}

export async function checkOverloadableApi(token: string, ex_move_id: number): Promise<{ overloadable: boolean; progress_type?: string; reason?: string }> {
  const res = await fetch(`${API_BASE_URL}/api/workout/is-overloadable?ex_move_id=${ex_move_id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to check overload');
  }
  return res.json();
}

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

export async function registerApi(userData: any) {
  const res = await fetch(`${API_BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed.');
  }
  return res.json();
}

export async function changePasswordApi(username: string, birthdate: string, new_password: string) {
  const res = await fetch(`${API_BASE_URL}/api/user/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, birthdate, newPassword: new_password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to change password.');
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
export async function fetchWorkout(token: string, workout_type: string, limit: number, user_id?: number) {
  const params = new URLSearchParams({ workout_type, limit: limit.toString() });
  if (user_id) params.append('user_id', user_id.toString());
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
 * 4. Fetch User Profile
 */
export async function fetchUserProfile(token: string, user_id?: number) {
  const url = user_id ? `${API_BASE_URL}/api/user/profile?user_id=${user_id}` : `${API_BASE_URL}/api/user/profile`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
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
  return res.json();
}

/**
 * 5. Generate Image for Sharing
 */
export async function generateShareImage(token: string, PRID: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ PRID }),
  });
  if (!res.ok) {
    let errorText = 'Unknown error';
    try {
      const errBody = await res.json();
      errorText = errBody.error || JSON.stringify(errBody);
    } catch (e) {
      errorText = await res.text();
    }
    throw new Error(`Error ${res.status}: ${errorText}`);
  }
  return res.blob();
}

export async function generatePlanShareImage(token: string, plan_id: number) {
  const res = await fetch(`${API_BASE_URL}/api/generate-plan-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ plan_id })
  });
  if (!res.ok) {
    let errorText = 'Unknown error';
    try {
      const errBody = await res.json();
      errorText = errBody.error || JSON.stringify(errBody);
    } catch (e) {
      errorText = await res.text();
    }
    throw new Error(`Error ${res.status}: ${errorText}`);
  }
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
 * 7. Fetch Recent Plan ID
 */
export async function fetchRecentPlanId(token: string, user_id?: number) {
  const url = user_id ? `${API_BASE_URL}/api/workout/recent-plan?user_id=${user_id}` : `${API_BASE_URL}/api/workout/recent-plan`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch recent plan id');
  return res.json();
}

/**
 * 8. Fetch Workout Plans
 */
export async function fetchWorkoutPlans(token: string, user_id?: number) {
  const url = user_id ? `${API_BASE_URL}/api/workout-plan?user_id=${user_id}` : `${API_BASE_URL}/api/workout-plan`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch workout plans');
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

export async function fetchBodyStatsHistory(token: string, user_id?: number) {
  const url = user_id ? `${API_BASE_URL}/api/workout/body-stats-history?user_id=${user_id}` : `${API_BASE_URL}/api/workout/body-stats-history`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch body stats history');
  return res.json();
}

export async function fetchClients(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/coach/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    if (res.status === 404 || res.status === 403) return [];
    throw new Error('Failed to fetch clients');
  }
  return res.json();
}

export async function inviteClient(token: string, client_id: number, username: string) {
  const res = await fetch(`${API_BASE_URL}/api/coach/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ client_id, username })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(()=>({}));
    throw new Error(errorData.error || 'Failed to invite client');
  }
  return res.json();
}

export async function removeClient(token: string, client_id: number) {
  const res = await fetch(`${API_BASE_URL}/api/coach/client/${client_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(()=>({}));
    throw new Error(errorData.error || 'Failed to remove client');
  }
  return res.json();
}

export async function unsubscribeApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/user/unsubscribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error || 'Failed to unsubscribe');
  }
  return res.json();
}

export async function upgradeSubscription(token: string) {
  const res = await fetch(`${API_BASE_URL}/api/user/upgrade`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Upgrade failed');
  return res.json();
}

// Admin Endpoints
export const fetchAllUsers = async (token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` }});
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const updateUserRoleApi = async (token: string, userId: number, status: string) => {
  const res = await fetch(`${API_BASE_URL}/api/admin/user/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update role');
  return res.json();
};

export const fetchAllPublicExercisesApi = async (token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/admin/exercises`, { headers: { Authorization: `Bearer ${token}` }});
  if (!res.ok) throw new Error('Failed to fetch public exercises');
  return res.json();
};

export const updateAdminExerciseApi = async (token: string, id: number, exerciseData: any) => {
  const res = await fetch(`${API_BASE_URL}/api/admin/exercise/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(exerciseData)
  });
  if (!res.ok) throw new Error('Failed to update exercise');
  return res.json();
};

export const deleteAdminExerciseApi = async (token: string, id: number) => {
  const res = await fetch(`${API_BASE_URL}/api/admin/exercise/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete exercise');
  return res.json();
};
