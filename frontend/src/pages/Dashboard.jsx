import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

export default function Dashboard() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const ac = new AbortController();
		let didRedirect = false;

		apiFetch('/api/data/user', { signal: ac.signal })
			.then((res) => {
				if (res && res.user) {
					setUser(res.user);
				} else {
					setUser(null);
				}
			})
			.catch((err) => {
				if (err && err.status === 401) {
					// redirect once to login, avoid loops
					if (!didRedirect) {
						didRedirect = true;
						window.location.href = '/login';
					}
				} else if (err.name === 'AbortError') {
					// fetch aborted — ignore
				} else {
					console.error('Dashboard fetch error', err);
				}
			})
			.finally(() => setLoading(false));

		return () => ac.abort();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (!user) return <div>No user — redirecting to login...</div>;

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome, user id: {user.id}</p>
			{/* render rest of dashboard */}
		</div>
	);
}