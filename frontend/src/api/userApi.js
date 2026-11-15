
const API_URL = 'http://localhost:5000/api/users';

async function request(url, options = {}) {
    const token = localStorage.getItem('jwt');

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message || data.error || `HTTP ${response.status}`
        );
    }

    return data;
}

export const userApi = {
    getAllUsers: () => request(API_URL),

    getUserById: (id) => request(`${API_URL}/${id}`),

    createUser: (data) => request(API_URL, {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    updateUser: (id, data) => request(`${API_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    deleteUser: (id) => request(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
};
