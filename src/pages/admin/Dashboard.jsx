import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import StatCard from '../../components/admin/StatCard';
import { GraduationCap, UserCheck, Briefcase, BadgeIndianRupee, AlertTriangle, RotateCcw, AlertCircle } from 'lucide-react';
import { getDashboardSummaryAPI } from '../../services/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalStaff: 0,
    totalFees: 0,
    pendingFees: 0
  });

  const fetchDashboardSummary = useCallback(async () => {
    setLoading(true);
    setApiError('');

    try {
      const res = await getDashboardSummaryAPI();
      if (res.success && res.data) {
        setStatsData(res.data);
      } else {
        setApiError('Unable to load dashboard summary data.');
      }
    } catch (err) {
      console.warn('Dashboard fetch notice:', err.message);
      setApiError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  // Construct Stat Cards array using real-time dynamic data
  const dashboardStats = [
    {
      title: 'Total Students',
      value: loading ? 'Loading...' : String(statsData.totalStudents),
      icon: GraduationCap,
      iconColor: '#D4AF37'
    },
    {
      title: 'Total Teachers',
      value: loading ? 'Loading...' : String(statsData.totalTeachers),
      icon: UserCheck,
      iconColor: '#3B82F6'
    },
    {
      title: 'Total Staff',
      value: loading ? 'Loading...' : String(statsData.totalStaff),
      icon: Briefcase,
      iconColor: '#8B5CF6'
    },
    {
      title: 'Total Fees',
      value: loading ? 'Loading...' : `₹${Number(statsData.totalFees).toLocaleString('en-IN')}`,
      icon: BadgeIndianRupee,
      iconColor: '#10B981'
    },
    {
      title: 'Pending Fees',
      value: loading ? 'Loading...' : `₹${Number(statsData.pendingFees).toLocaleString('en-IN')}`,
      icon: AlertTriangle,
      iconColor: '#EF4444'
    }
  ];

  const firstRowStats = dashboardStats.slice(0, 3);
  const secondRowStats = dashboardStats.slice(3, 5);

  return (
    <AdminLayout>
      {/* Compact Welcome Section */}
      <div className="welcome-banner">
        <h2 className="welcome-title">Welcome, Admin 👋</h2>
        <p className="welcome-subtitle">
          Manage and monitor Unique Classes from one place.
        </p>
      </div>

      {/* Error Banner with Retry */}
      {apiError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
          <button
            onClick={fetchDashboardSummary}
            style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '0.4rem 0.95rem', borderRadius: '4px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="stats-container">
        {/* First Row: Total Students, Total Teachers, Total Staff */}
        <div className="stats-row-first">
          {firstRowStats.map((stat, idx) => (
            <StatCard
              key={idx}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
            />
          ))}
        </div>

        {/* Second Row: Total Fees, Pending Fees */}
        <div className="stats-row-second">
          {secondRowStats.map((stat, idx) => (
            <StatCard
              key={idx}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
