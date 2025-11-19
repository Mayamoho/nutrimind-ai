// If using fetch:
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function apiFetch(path, options = {}) {
	const controller = options.signal ? null : new AbortController();
	const signal = options.signal || controller?.signal;
	const res = await fetch(API_BASE + path, {
		method: options.method || 'GET',
		credentials: 'include', // include cookies
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		},
		body: options.body ? JSON.stringify(options.body) : undefined,
		signal,
	});
	const text = await res.text();
	let data = null;
	try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
	if (!res.ok) {
		const err = new Error('API Error');
		err.status = res.status;
		err.data = data;
		throw err;
	}
	return data;
}

// If using axios, set this once:
// import axios from 'axios';
// axios.defaults.withCredentials = true;
// export default axios;