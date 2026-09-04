import React, { useState } from 'react';
import logo from '../assets/Trello Logo.jpeg';
import profile from '../assets/profile-placeholder.jpeg';

// ADDED: Type definition for the props passed from App.tsx
interface NavProps {
  user?: { name: string; email: string };
  onLogout?: () => void;
}

// ADDED: Accept the user and onLogout props
const Nav: React.FC<NavProps> = ({ user, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="w-full h-20 flex items-center justify-between px-10 mb-8">
            <div className='flex items-center gap-2 rounded-lg '><div />  {/*left div */}
                <img src={logo} alt="logo" className='w-10 h-10 rounded-lg' />
            </div>

            <div className='flex gap-2 w-1/2 p-2 justify-center'>  {/*center div */}
                <div className='relative w-full'>
                    <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z' />
                    </svg>
                    <input type="text" className='w-full h-10 bg-gray-500 rounded-md pl-9 pr-2 placeholder:text-white' placeholder='Search' />

                </div>
                <button type="button" className='text-white hover:bg-[#0a429a] bg-[#0C66E4] transition-all duration-200 ease-in-out rounded-md px-4 py-2'  >Create</button>
            </div>



            <div className='flex items-center gap-4'>
                <button className='text-white hover:text-gray-300 transition-all duration-200'>
                    <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-6 h-6'>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' />
                    </svg>
                </button>
                {/* ADDED: Dynamic profile display with logout functionality in a dropdown */}
                <div className="relative">
                    <div 
                      className='w-10 h-10 rounded-full bg-[#0C66E4] flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-700 transition-colors'
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        {user && user.name ? user.name.charAt(0).toUpperCase() : (
                            <img src={profile} alt="profile" className='w-10 h-10 rounded-full' />
                        )}
                    </div>

                    {/* ADDED: Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#282E33] border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-600">
                                <p className="text-sm text-white font-medium">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#333C43] transition-colors"
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div> {/*right div */}

        </div>
    )
}

export default Nav