// import React, { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { Gender } from '../types';
// import { countries } from '../utils/countries';
// import { api } from '../services/api';

// const Auth: React.FC = () => {
//     const { login } = useAuth();
//     const [isLogin, setIsLogin] = useState(true);
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [lastName, setLastName] = useState('');
//     const [weight, setWeight] = useState('');
//     const [height, setHeight] = useState('');
//     const [age, setAge] = useState('');
//     const [gender, setGender] = useState<Gender>('male');
//     const [country, setCountry] = useState<string>(countries[0]);
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setLoading(true);

//         try {
//             if (isLogin) {
//                 const { user, token } = await api.login(email, password);
//                 login(user, token);
//             } else { // Sign up
//                 if (!lastName || !weight || !height || !age || !country || !email || !password) {
//                     setError('Please fill in all fields.');
//                     setLoading(false);
//                     return;
//                 }
//                 const weightFloat = parseFloat(weight);
//                 const signupData = {
//                     email,
//                     password,
//                     lastName,
//                     weight: weightFloat,
//                     height: parseFloat(height),
//                     age: parseInt(age),
//                     gender,
//                     country,
//                 };
//                 const { user, token } = await api.signup(signupData);
//                 login(user, token);
//             }
//         } catch (err: any) {
//             setError(err.message || 'An error occurred.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
//             <div className="text-center mb-8">
//                  <div className="flex items-center justify-center space-x-2 mb-2">
//                     <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
//                     <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
//                         NutriMind <span className="text-emerald-500">AI</span>
//                     </h1>
//                 </div>
//                 <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">{isLogin ? 'Welcome Back!' : 'Create Your Account'}</h2>
//             </div>
//             <form onSubmit={handleSubmit} className="space-y-6">
//                 <div>
//                     <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
//                     <input
//                         type="email"
//                         id="email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                         placeholder="you@example.com"
//                         required
//                     />
//                 </div>
//                  {!isLogin && (
//                     <>
//                         <div>
//                             <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
//                             <input
//                                 type="text"
//                                 id="lastName"
//                                 value={lastName}
//                                 onChange={(e) => setLastName(e.target.value)}
//                                 className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                                 placeholder="Smith"
//                                 required={!isLogin}
//                             />
//                         </div>
//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
//                                 <input
//                                     type="number"
//                                     id="weight"
//                                     value={weight}
//                                     onChange={(e) => setWeight(e.target.value)}
//                                     className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                                     placeholder="70"
//                                     required={!isLogin}
//                                 />
//                             </div>
//                              <div>
//                                 <label htmlFor="height" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Height (cm)</label>
//                                 <input
//                                     type="number"
//                                     id="height"
//                                     value={height}
//                                     onChange={(e) => setHeight(e.target.value)}
//                                     className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                                     placeholder="175"
//                                     required={!isLogin}
//                                 />
//                             </div>
//                         </div>
//                          <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
//                                 <input
//                                     type="number"
//                                     id="age"
//                                     value={age}
//                                     onChange={(e) => setAge(e.target.value)}
//                                     className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                                     placeholder="30"
//                                     required={!isLogin}
//                                 />
//                             </div>
//                              <div>
//                                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
//                                 <select 
//                                     id="gender" 
//                                     value={gender}
//                                     onChange={(e) => setGender(e.target.value as Gender)}
//                                     className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                                 >
//                                     <option value="male">Male</option>
//                                     <option value="female">Female</option>
//                                     <option value="other">Other</option>
//                                 </select>
//                             </div>
//                         </div>
//                         <div>
//                             <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
//                             <select 
//                                 id="country" 
//                                 value={country}
//                                 onChange={(e) => setCountry(e.target.value)}
//                                 className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                             >
//                                 {countries.map(c => <option key={c} value={c}>{c}</option>)}
//                             </select>
//                         </div>
//                     </>
//                 )}
//                 <div>
//                     <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
//                     <input
//                         type="password"
//                         id="password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                          className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
//                         placeholder="••••••••"
//                         required
//                     />
//                 </div>

//                 {error && <p className="text-sm text-red-500 text-center">{error}</p>}

//                 <div>
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors duration-300 disabled:bg-slate-400"
//                     >
//                         {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
//                     </button>
//                 </div>
//             </form>
//             <div className="mt-6 text-center">
//                 <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
//                     {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default Auth;

// frontend/auth.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gender } from '../types';
import { countries } from '../utils/countries';
import { api } from '../services/api';

const Auth: React.FC = () => {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [lastName, setLastName] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<Gender>('male');
    const [country, setCountry] = useState<string>(countries[0]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return; // prevent double submit
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // login via api service (should call /api/auth/login)
                const { user, token } = await api.login(email, password);
                login(user, token);
            } else { // Sign up
                if (!lastName || !weight || !height || !age || !country || !email || !password) {
                    setError('Please fill in all fields.');
                    setLoading(false);
                    return;
                }
                const weightFloat = parseFloat(weight);
                const signupData = {
                    email,
                    password,
                    lastName,
                    weight: weightFloat,
                    height: parseFloat(height),
                    age: parseInt(age),
                    gender,
                    country,
                };
                const { user, token } = await api.signup(signupData);
                login(user, token);
            }
        } catch (err: any) {
            // Network-level error (fetch failed, CORS blocked, or server unreachable)
            if (err instanceof TypeError || (err && /failed to fetch/i.test(err.message || ''))) {
                setError('Network error: cannot reach the backend. Make sure your backend is running at http://localhost:3001 and that Vite dev server (http://localhost:3000) is proxying /api. Check browser console / network tab for details.');
            } else if (err && err.message) {
                // api service threw a helpful message
                setError(err.message);
            } else {
                setError('An unknown error occurred. Check the browser console and server logs.');
            }
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
                 <div className="flex items-center justify-center space-x-2 mb-2">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        NutriMind <span className="text-emerald-500">AI</span>
                    </h1>
                </div>
                <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300">{isLogin ? 'Welcome Back!' : 'Create Your Account'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                        placeholder="you@example.com"
                        required
                    />
                </div>
                 {!isLogin && (
                    <>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                                placeholder="Smith"
                                required={!isLogin}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    id="weight"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                                    placeholder="70"
                                    required={!isLogin}
                                />
                            </div>
                             <div>
                                <label htmlFor="height" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    id="height"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                                    placeholder="175"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
                                <input
                                    type="number"
                                    id="age"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                                    placeholder="30"
                                    required={!isLogin}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                                <select 
                                    id="gender" 
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value as Gender)}
                                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                            <select 
                                id="country" 
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                            >
                                {countries.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </>
                )}
                <div>
                    <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                         className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border-transparent focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors duration-300 disabled:bg-slate-400"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </div>
            </form>
            <div className="mt-6 text-center">
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
                    {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
                </button>
            </div>
        </div>
    );
};

export default Auth;
