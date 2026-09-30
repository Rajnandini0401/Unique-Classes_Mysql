import React, { createContext, useState, useEffect } from 'react';
import { fetchAPI, getAuthenticatedTeacherProfileAPI, getAuthenticatedStaffProfileAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearStaleSessionState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentId');
    localStorage.removeItem('currentStudentId');
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherId');
    localStorage.removeItem('activeTeacherId');
    localStorage.removeItem('staffUser');
    localStorage.removeItem('staffToken');
    setUser(null);
    setTeacherProfile(null);
    setStaffProfile(null);
  };

  const fetchTeacherProfile = async () => {
    try {
      const res = await getAuthenticatedTeacherProfileAPI();
      if (res && res.success && res.teacher) {
        setTeacherProfile(res.teacher);
        return res.teacher;
      }
    } catch (err) {
      console.warn('Failed to load authenticated teacher profile:', err.message);
    }
    setTeacherProfile(null);
    return null;
  };

  const fetchStaffProfile = async () => {
    try {
      const res = await getAuthenticatedStaffProfileAPI();
      if (res && res.success && res.staff) {
        setStaffProfile(res.staff);
        return res.staff;
      }
    } catch (err) {
      console.warn('Failed to load authenticated staff profile:', err.message);
    }
    setStaffProfile(null);
    return null;
  };

  useEffect(() => {
    const checkLoggedInUser = async () => {
      // Clear legacy/stale local storage IDs
      localStorage.removeItem('teacherId');
      localStorage.removeItem('activeTeacherId');
      localStorage.removeItem('staffUser');

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await fetchAPI('/auth/me');
          if (userData && userData.success !== false && userData.role) {
            setUser(userData);
            if (userData.role === 'teacher') {
              const profile = await fetchTeacherProfile();
              if (!profile) {
                clearStaleSessionState();
              }
            } else if (userData.role === 'office' || userData.role === 'staff') {
              await fetchStaffProfile();
            } else {
              setTeacherProfile(null);
              setStaffProfile(null);
            }
          } else {
            clearStaleSessionState();
          }
        } catch (error) {
          clearStaleSessionState();
        }
      } else {
        clearStaleSessionState();
      }
      setLoading(false);
    };
    checkLoggedInUser();
  }, []);

  const login = async (email, password) => {
    clearStaleSessionState();

    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data && data.token) {
      localStorage.setItem('token', data.token);
      setUser(data);

      if (data.role === 'student' || data.student_id || data.studentId) {
        const sId = data.student_id || data.studentId || data.id;
        if (sId) {
          localStorage.setItem('studentId', String(sId));
          localStorage.setItem('currentStudentId', String(sId));
        }
      }

      if (data.role === 'teacher') {
        const profile = await fetchTeacherProfile();
        if (!profile) {
          clearStaleSessionState();
          throw new Error('Teacher profile could not be loaded for this account.');
        }
      } else if (data.role === 'office' || data.role === 'staff') {
        const profile = await fetchStaffProfile();
        if (!profile) {
          clearStaleSessionState();
          throw new Error('Staff profile could not be loaded for this account.');
        }
      } else {
        setTeacherProfile(null);
        setStaffProfile(null);
      }
    }

    return data;
  };

  const logout = () => {
    clearStaleSessionState();
  };

  return (
    <AuthContext.Provider value={{ user, teacherProfile, staffProfile, loading, login, logout, fetchTeacherProfile, fetchStaffProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
