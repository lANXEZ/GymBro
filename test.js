const fs = require('fs');
const p = 'e:/Work/VSCode Repo/GymBro/gymbro/app/lib/apiClient.ts';
let text = fs.readFileSync(p, 'utf8');

const marker = 'export async function unsubscribeApi(token: string) {';
const idx = text.lastIndexOf(marker);
const endIdx = text.indexOf('return res.json();\n}', idx);
text = text.substring(0, endIdx + 20) + '\n\n';

text += `// Admin Endpoints
export const fetchAllUsers = async (token: string) => {
  const res = await fetch(\`\${API_BASE_URL}/api/admin/users\`, { headers: { Authorization: \`Bearer \${token}\` }});
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const updateUserRoleApi = async (token: string, userId: number, status: string) => {
  const res = await fetch(\`\${API_BASE_URL}/api/admin/user/\${userId}/role\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update role');
  return res.json();
};

export const fetchAllPublicExercisesApi = async (token: string) => {
  const res = await fetch(\`\${API_BASE_URL}/api/admin/exercises\`, { headers: { Authorization: \`Bearer \${token}\` }});
  if (!res.ok) throw new Error('Failed to fetch public exercises');
  return res.json();
};

export const updateAdminExerciseApi = async (token: string, id: number, exerciseData: any) => {
  const res = await fetch(\`\${API_BASE_URL}/api/admin/exercise/\${id}\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
    body: JSON.stringify(exerciseData)
  });
  if (!res.ok) throw new Error('Failed to update exercise');
  return res.json();
};

export const deleteAdminExerciseApi = async (token: string, id: number) => {
  const res = await fetch(\`\${API_BASE_URL}/api/admin/exercise/\${id}\`, {
    method: 'DELETE',
    headers: { Authorization: \`Bearer \${token}\` }
  });
  if (!res.ok) throw new Error('Failed to delete exercise');
  return res.json();
};
`;
fs.writeFileSync(p, text, 'utf8');
console.log('Success');
