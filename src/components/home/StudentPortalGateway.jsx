import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  CalendarCheck,
  Receipt,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  Info,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem, AnimatedCounter } from '../common/ScrollAnimation';
import '../../styles/portal-preview.css';

/**
 * StudentPortalGateway (Portal Access for Enrolled Students & Parents)
 * High-fidelity dashboard preview modeled after real academic portals:
 * 1. Student Attendance (Donut Visualization & Monthly Rate)
 * 2. Fees Overview (Total, Paid, Overdue & Installment Breakdown)
 * 3. Exam Results (KPIs & Clustered Subject Bar Chart)
 *
 * Royal Black & Gold theme, fully mobile-first responsive.
 */
const StudentPortalGateway = () => {
  // Existing verified working portal authentication route
  const portalLoginRoute = '/login';

  return (
    <section
      className="portal-preview-section"
      id="portal-access"
      aria-labelledby="portal-access-heading"
    >
      {/* Subtle Ambient Radial Lighting */}
      <div className="portal-ambient-glow" aria-hidden="true" />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* =================================================================
            1. SECTION HEADER & SHORT NOTE
            ================================================================= */}
        <ScrollReveal direction="up" duration={0.6}>
          <div className="portal-header-wrapper">
            <div className="portal-eyebrow-badge">
              <ShieldCheck size={14} color="#F4C542" />
              <span>PORTAL ACCESS FOR ENROLLED STUDENTS & PARENTS</span>
            </div>

            <h2 id="portal-access-heading" className="portal-main-heading">
              तुमची शैक्षणिक प्रगती, <span className="gold-accent">आता थेट डिजिटल पोर्टलवर.</span>
            </h2>

            <p className="portal-convenient-note">
              “A convenient portal experience for enrolled students and parents.”
            </p>

            <div className="portal-preview-disclaimer">
              <Info size={13} color="#F4C542" />
              <span>Portal Preview • Enrolled students & parents access live records via official Student ID</span>
            </div>
          </div>
        </ScrollReveal>

        {/* =================================================================
            2. THREE-CARD DASHBOARD PREVIEW (INSPIRED BY REFERENCE)
            ================================================================= */}
        <StaggerContainer className="portal-dashboard-grid" staggerDelay={0.12}>
          {/* -------------------------------------------------------------
              CARD 1: STUDENT ATTENDANCE (DONUT CHART)
              ------------------------------------------------------------- */}
          <StaggerItem>
            <div className="portal-preview-card">
              <div className="portal-card-header">
                <h3 className="portal-card-title">
                  <CalendarCheck size={18} color="#14B8A6" />
                  <span>Student Attendance</span>
                </h3>
                <span className="portal-card-preview-pill">Portal Preview</span>
              </div>

              {/* Donut Chart Visual */}
              <div className="attendance-chart-wrap">
                <div className="attendance-donut-box">
                  <svg viewBox="0 0 160 160" className="attendance-donut-svg" aria-hidden="true">
                    {/* Track Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="58"
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="15"
                    />
                    {/* Present Segment: 82% (298.8 of 364.4) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="58"
                      fill="transparent"
                      stroke="#14B8A6"
                      strokeWidth="15"
                      strokeDasharray="298.8 364.4"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Absent Segment: 12% (43.7 of 364.4) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="58"
                      fill="transparent"
                      stroke="#38BDF8"
                      strokeWidth="15"
                      strokeDasharray="43.7 364.4"
                      strokeDashoffset="-298.8"
                      strokeLinecap="round"
                    />
                    {/* Late Segment: 6% (21.9 of 364.4) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="58"
                      fill="transparent"
                      stroke="#FB923C"
                      strokeWidth="15"
                      strokeDasharray="21.9 364.4"
                      strokeDashoffset="-342.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Center Stat Callout */}
                  <div className="attendance-center-data">
                    <span className="attendance-big-pct">
                      <AnimatedCounter value="82%" />
                    </span>
                    <span className="attendance-sub-lbl">Attendance</span>
                  </div>
                </div>
              </div>

              {/* Attendance Legend */}
              <div className="attendance-legend-row">
                <div className="attendance-legend-item">
                  <span className="legend-dot present" />
                  <span>82% Present</span>
                </div>
                <div className="attendance-legend-item">
                  <span className="legend-dot absent" />
                  <span>12% Absent</span>
                </div>
                <div className="attendance-legend-item">
                  <span className="legend-dot late" />
                  <span>6% Late</span>
                </div>
              </div>

              {/* Bottom Insight Footer */}
              <div className="card-footer-link">
                <span>Monthly Biometric Attendance Log</span>
                <ChevronRight size={15} />
              </div>
            </div>
          </StaggerItem>

          {/* -------------------------------------------------------------
              CARD 2: FEES OVERVIEW (STAT TILES & INSTALLMENT STATUS)
              ------------------------------------------------------------- */}
          <StaggerItem>
            <div className="portal-preview-card">
              <div className="portal-card-header">
                <h3 className="portal-card-title">
                  <Receipt size={18} color="#F4C542" />
                  <span>Fees Overview</span>
                </h3>
                <span className="portal-card-preview-pill">Portal Preview</span>
              </div>

              {/* Top 3 Metric Stat Tiles */}
              <div className="fees-stat-tiles-row">
                <div className="fees-stat-tile total">
                  <div className="tile-label">Total Fees</div>
                  <div className="tile-val">
                    <AnimatedCounter value="₹48,500" />
                  </div>
                </div>
                <div className="fees-stat-tile paid">
                  <div className="tile-label">Paid</div>
                  <div className="tile-val">
                    <AnimatedCounter value="₹36,200" />
                  </div>
                </div>
                <div className="fees-stat-tile overdue">
                  <div className="tile-label">Overdue</div>
                  <div className="tile-val">
                    <AnimatedCounter value="₹12,300" />
                  </div>
                </div>
              </div>

              {/* Sub-label */}
              <div className="fees-subheading">Payment Status by Term</div>

              {/* Stacked Segmented Progress Bars */}
              <div className="fees-bars-stack">
                {/* Bar 1: Term 1 Tuition */}
                <div className="fees-bar-entry">
                  <div className="fees-bar-meta">
                    <span className="desc">Term 1 Tuition</span>
                    <span className="amt">₹20,000 / ₹20,000</span>
                  </div>
                  <div className="fees-segmented-track">
                    <div className="fees-seg seg-paid" style={{ width: '75%' }} title="Paid" />
                    <div className="fees-seg seg-due" style={{ width: '25%' }} title="Due" />
                  </div>
                </div>

                {/* Bar 2: Term 2 Tuition */}
                <div className="fees-bar-entry">
                  <div className="fees-bar-meta">
                    <span className="desc">Term 2 Tuition</span>
                    <span className="amt">₹16,200 / ₹20,000</span>
                  </div>
                  <div className="fees-segmented-track">
                    <div className="fees-seg seg-paid" style={{ width: '60%' }} title="Paid" />
                    <div className="fees-seg seg-overdue" style={{ width: '40%' }} title="Overdue" />
                  </div>
                </div>

                {/* Bar 3: Test Series & Study Material */}
                <div className="fees-bar-entry">
                  <div className="fees-bar-meta">
                    <span className="desc">Test Series & Material</span>
                    <span className="amt">Pending Clearance</span>
                  </div>
                  <div className="fees-segmented-track">
                    <div className="fees-seg seg-overdue" style={{ width: '35%' }} title="Overdue" />
                  </div>
                </div>
              </div>

              {/* Fees Legend */}
              <div className="fees-legend-row">
                <div className="attendance-legend-item">
                  <span className="legend-dot present" />
                  <span>Paid</span>
                </div>
                <div className="attendance-legend-item">
                  <span className="legend-dot absent" />
                  <span>Due</span>
                </div>
                <div className="attendance-legend-item">
                  <span className="legend-dot late" style={{ background: '#FB7185' }} />
                  <span>Overdue</span>
                </div>
              </div>

              {/* Bottom Insight Footer */}
              <div className="card-footer-link" style={{ color: '#F4C542' }}>
                <span>Instant GST Receipt Download (PDF)</span>
                <ChevronRight size={15} />
              </div>
            </div>
          </StaggerItem>

          {/* -------------------------------------------------------------
              CARD 3: EXAM RESULTS (KPIS & SUBJECT-WISE BAR CHART)
              ------------------------------------------------------------- */}
          <StaggerItem>
            <div className="portal-preview-card">
              <div className="portal-card-header">
                <h3 className="portal-card-title">
                  <Award size={18} color="#38BDF8" />
                  <span>Exam Results</span>
                </h3>
                <span className="portal-card-preview-pill">Portal Preview</span>
              </div>

              {/* 3 Top KPIs Row */}
              <div className="exam-kpis-row">
                <div className="exam-kpi-chip">
                  <FileText size={16} color="#CBD5E1" />
                  <span className="exam-kpi-title">Average</span>
                  <span className="exam-kpi-val gold">
                    <AnimatedCounter value="78%" />
                  </span>
                </div>
                <div className="exam-kpi-chip">
                  <CheckCircle2 size={16} color="#34D399" />
                  <span className="exam-kpi-title">Pass Rate</span>
                  <span className="exam-kpi-val green">
                    <AnimatedCounter value="86%" />
                  </span>
                </div>
                <div className="exam-kpi-chip">
                  <AlertCircle size={16} color="#FB7185" />
                  <span className="exam-kpi-title">Review</span>
                  <span className="exam-kpi-val red">
                    <AnimatedCounter value="12%" />
                  </span>
                </div>
              </div>

              {/* Sub-label */}
              <div className="fees-subheading">Recent Exams (Subject-wise Marks)</div>

              {/* Clustered Subject Bar Chart (Clean Vector SVG) */}
              <div className="exam-chart-wrapper">
                <svg viewBox="0 0 320 165" className="exam-chart-svg" aria-label="Subject Marks Comparison Chart">
                  {/* Y-axis Subtle Gridlines & Numbers */}
                  <line x1="30" y1="20" x2="310" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <text x="22" y="24" fill="#64748B" fontSize="9" textAnchor="end" fontFamily="sans-serif">100</text>

                  <line x1="30" y1="50" x2="310" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <text x="22" y="54" fill="#64748B" fontSize="9" textAnchor="end" fontFamily="sans-serif">80</text>

                  <line x1="30" y1="80" x2="310" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <text x="22" y="84" fill="#64748B" fontSize="9" textAnchor="end" fontFamily="sans-serif">60</text>

                  <line x1="30" y1="110" x2="310" y2="110" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <text x="22" y="114" fill="#64748B" fontSize="9" textAnchor="end" fontFamily="sans-serif">40</text>

                  <line x1="30" y1="140" x2="310" y2="140" stroke="rgba(255,255,255,0.12)" />
                  <text x="22" y="143" fill="#64748B" fontSize="9" textAnchor="end" fontFamily="sans-serif">0</text>

                  {/* 1. MATH GROUP (x: 55..105, center: 80) */}
                  <rect x="52" y="38" width="16" height="102" rx="3" fill="#14B8A6" />
                  <rect x="72" y="48" width="16" height="92" rx="3" fill="#38BDF8" />
                  <rect x="92" y="26" width="16" height="114" rx="3" fill="#F4C542" />
                  <text x="80" y="156" fill="#E2E8F0" fontSize="11" fontWeight="700" textAnchor="middle">Math</text>

                  {/* 2. SCIENCE GROUP (x: 135..185, center: 160) */}
                  <rect x="132" y="54" width="16" height="86" rx="3" fill="#14B8A6" />
                  <rect x="152" y="34" width="16" height="106" rx="3" fill="#FB7185" />
                  <rect x="172" y="48" width="16" height="92" rx="3" fill="#94A3B8" />
                  <text x="160" y="156" fill="#E2E8F0" fontSize="11" fontWeight="700" textAnchor="middle">Science</text>

                  {/* 3. HISTORY / ENGLISH GROUP (x: 215..265, center: 240) */}
                  <rect x="212" y="22" width="16" height="118" rx="3" fill="#14B8A6" />
                  <rect x="232" y="46" width="16" height="94" rx="3" fill="#38BDF8" />
                  <rect x="252" y="36" width="16" height="104" rx="3" fill="#94A3B8" />
                  <text x="240" y="156" fill="#E2E8F0" fontSize="11" fontWeight="700" textAnchor="middle">English</text>
                </svg>
              </div>

              {/* Exam Legend */}
              <div className="exam-legend-row">
                <div className="attendance-legend-item">
                  <span className="legend-dot test1" />
                  <span>Unit Test</span>
                </div>
                <div className="attendance-legend-item">
                  <span className="legend-dot midterm" />
                  <span>Mid-Term</span>
                </div>
                <div className="attendance-legend-item">
                  <span className="legend-dot preboard" />
                  <span>Pre-Board</span>
                </div>
              </div>

              {/* Bottom Insight Footer */}
              <div className="card-footer-link" style={{ color: '#38BDF8' }}>
                <span>Download Official Report Card</span>
                <ChevronRight size={15} />
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* =================================================================
            3. WORKING PORTAL LOGIN ACTION BANNER
            ================================================================= */}
        <ScrollReveal direction="up" delay={0.15} glow={true}>
          <div className="portal-cta-banner">
            <div className="portal-cta-left">
              <span className="portal-cta-tag">
                <Sparkles size={13} />
                <span>ACTIVE STUDENT PORTAL GATEWAY</span>
              </span>
              <h3 className="portal-cta-title">
                तुमच्याकडे युनिक क्लासेसचा Student ID आहे का?
              </h3>
              <p className="portal-cta-desc">
                दैनंदिन हजेरी, साप्ताहिक परीक्षांचे विषयवार गुण, मॉडेल उत्तरपत्रिका आणि अधिकृत जीएसटी फी पावती थेट पोर्टलवर पहा.
              </p>
            </div>

            <div className="portal-cta-actions">
              {/* Working Student & Parent Portal Login Button */}
              <Link
                to={portalLoginRoute}
                className="portal-login-btn"
                aria-label="Login to Student and Parent Portal"
              >
                <UserCheck size={19} />
                <span>Student & Parent Portal</span>
                <ArrowRight size={18} />
              </Link>

              {/* Helpline / Office Assistance */}
              <a
                href="tel:8308433436"
                className="portal-help-link"
                aria-label="Call office for Student ID assistance"
              >
                <span>ID विसरला? कॉल करा: 8308433436</span>
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default StudentPortalGateway;
