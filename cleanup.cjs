const fs = require('fs');
const p = 'e:/Work/VSCode Repo/GymBro/gymbro/app/lib/apiClient.ts';
let text = fs.readFileSync(p, 'utf8');

// Find the last occurrence of unsubscribeApi
const mark = 'export async function unsubscribeApi(token: string) {';
const beginIndex = text.lastIndexOf(mark);
if(beginIndex === -1) { console.log('not found'); process.exit(1); }
let slice = text.substring(beginIndex);
const endIndex = slice.indexOf('return res.json();\n}');
if (endIndex === -1) { console.log('end not found'); process.exit(1); }

const cutoff = beginIndex + endIndex + 'return res.json();\n}'.length;
text = text.substring(0, cutoff) + '\n\n';

text += \// Admin Endpoints
export const fetchAllUsers = async (token: string) => {
  const res = await fetch(\\\\\\/api/admin/users\\\, { headers: { Authorization: \\\Bearer \\\\\\ }});
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
};

export const updateUserRoleApi = async (token: string, userId: number, status: string) => {
  const res = await fetch(\\\\\\/api/admin/user/\\\/role\\\, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: \\\Bearer \\\\\\ },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update role');
  return res.json();
};

export const fetchAllPublicExercisesApi = async (token: string) => {
  const res = await fetch(\\\\\\/api/admin/exercises\\\, { headers: { Authorization: \\\Bearer \\\\\\ }});
  if (!res.ok) throw new Error('Failed to fetch public exercises');
  return res.json();
};

export const updateAdminExerciseApi = async (token: string, id: number, exerciseData: any) => {
  const res = await fetch(\\\\\\/api/admin/exercise/\\\\\\, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: \\\Bearer \\\\\\ },
    body: JSON.stringify(exerciseData)
  });
  if (!res.ok) throw new Error('Failed to update exercise');
  return res.json();
};

export const deleteAdminExerciseApi = async (token: string, id: number) => {
  const res = await fetch(\\\\\\/api/admin/exercise/\\\\\\, {
    method: 'DELETE',
    headers: { Authorization: \\\Bearer \\\\\\ }
  });
  if (!res.ok) throw new Error('Failed to delete exercise');
  return res.json();
};
\;

fs.writeFileSync(p, text);
console.log('done');
