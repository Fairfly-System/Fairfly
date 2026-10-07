import './admin-layout.css';
import { Outlet, useLocation } from 'react-router';
import AppLayout from '../../../components/UI/AppLayout/AppLayout';
import KpiCard from '../../../components/UI/KpiCard/KpiCard';
import { useEffect, useState, useMemo } from 'react';
import { firestore } from '../../../firebase';
import { collection, onSnapshot, query, where, limit, getCountFromServer } from 'firebase/firestore';
import { useAuthContext } from '../../../context/AuthContext';

const baseAdminLinks = [
  { to: '/admin', end: true, icon: 'fa-solid fa-arrow-trend-up', label: 'Analytics' },
  { to: '/admin/services', icon: 'fa-regular fa-file-lines', label: 'Services' },
  { to: '/admin/workflow-templates', icon: 'fa-solid fa-diagram-project', label: 'Workflows' },
  { to: '/admin/operators', icon: 'fa-solid fa-users', label: 'Operators' },
  { to: '/admin/clients', icon: 'fa-solid fa-user-group', label: 'Clients' },
  { to: '/admin/resources', icon: 'fa-solid fa-folder-open', label: 'Resources' },
  { to: '/admin/announcements', icon: 'fa-solid fa-bullhorn', label: 'Announcements' },
  { to: '/admin/messages', icon: 'fa-solid fa-comments', label: 'Messages' },
  { to: '/admin/qualifications', icon: 'fa-solid fa-certificate', label: 'Qualifications' },
  { to: '/admin/tickets', icon: 'fa-solid fa-ticket', label: 'Tickets' },
  { to: '/admin/franchise-apps', icon: 'fa-solid fa-briefcase', label: 'Franchise Application' },
  { to: '/admin/appointments', icon: 'fa-regular fa-calendar-check', label: 'Consultations' },
  { to: '/admin/inquiry-history', icon: 'fa-solid fa-clipboard-list', label: 'Inquiry History' },
  { to: '/admin/quick-links', icon: 'fa-solid fa-link', label: 'Quick Links' },
  { to: '/admin/chatbot', icon: 'fa-solid fa-robot', label: 'Chatbot' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, userDetails } = useAuthContext();
  const isSuperAdmin = userDetails?.isSuperAdmin === true || userDetails?.email === 'admin@gmail.com' || user?.email === 'admin@gmail.com';
  const assignedOperators = useMemo(() => userDetails?.assignedOperators || [], [userDetails]);

  const navLinks = useMemo(() => {
    if (isSuperAdmin) {
      const links = [...baseAdminLinks];
      links.splice(5, 0, {
        to: '/admin/admins',
        icon: 'fa-solid fa-user-shield',
        label: 'Admins'
      });
      return links;
    }
    return baseAdminLinks;
  }, [isSuperAdmin]);

  // Services & User KPIs
  const [activeServices, setActiveServices] = useState(0);
  const [disabledServices, setDisabledServices] = useState(0);
  const [clients, setClients] = useState(0);
  const [activeOperators, setActiveOperators] = useState(0);
  const [disabledOperators, setDisabledOperators] = useState(0);

  // Tab Notification Counts
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingQualifications, setPendingQualifications] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [pendingApps, setPendingApps] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [pendingInquiries, setPendingInquiries] = useState(0);

  // Reset announcement badge when user navigates to Announcements page
  useEffect(() => {
    if (location.pathname === '/admin/announcements' && user?.uid) {
      localStorage.setItem(`fairfly_admin_last_announcements_seen_${user.uid}`, new Date().toISOString());
      setAnnouncementsCount(0);
    }
  }, [location.pathname, user?.uid]);

  useEffect(() => {
    // 1. Lightweight Server Aggregation for Total Counts
    const fetchCounters = async () => {
      try {
        const [activeSrv, totalSrv, activeOp, disabledOp, clientsSnap] = await Promise.all([
          getCountFromServer(query(collection(firestore, 'services'), where('status', '==', 'Active'))),
          getCountFromServer(collection(firestore, 'services')),
          getCountFromServer(query(collection(firestore, 'users'), where('role', '==', 'operator'), where('status', '==', 'Active'))),
          getCountFromServer(query(collection(firestore, 'users'), where('role', '==', 'operator'), where('status', '==', 'Disabled'))),
          getCountFromServer(query(collection(firestore, 'users'), where('role', '==', 'client')))
        ]);

        setActiveServices(activeSrv.data().count);
        setDisabledServices(Math.max(0, totalSrv.data().count - activeSrv.data().count));
        setActiveOperators(activeOp.data().count);
        setDisabledOperators(disabledOp.data().count);
        setClients(clientsSnap.data().count);
      } catch (err) {
        console.warn('AdminLayout getCountFromServer notice:', err?.message);
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 60000);

    // 2. Real-time badge indicators

    // 2.1 Announcements (Only if made by someone else)
    const qAnnouncements = query(collection(firestore, 'announcements'), limit(50));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      if (location.pathname === '/admin/announcements') {
        setAnnouncementsCount(0);
        return;
      }
      const lastSeenStr = user?.uid ? localStorage.getItem(`fairfly_admin_last_announcements_seen_${user.uid}`) : null;
      const lastSeenTime = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
      
      const unread = snapshot.docs.filter((doc) => {
        const d = doc.data();
        if (d.authorUid === user?.uid) return false;
        const createdTime = d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate().getTime() : new Date(d.createdAt).getTime()) : 0;
        return createdTime > lastSeenTime;
      });
      setAnnouncementsCount(unread.length);
    }, () => setAnnouncementsCount(0));

    // 2.2 Messages (Unread messages for this admin)
    let unsubMessages = () => {};
    if (user?.uid) {
      const qMessages = query(
        collection(firestore, 'conversations'),
        where('participants', 'array-contains', user.uid),
        limit(100)
      );
      unsubMessages = onSnapshot(qMessages, (snapshot) => {
        let total = 0;
        snapshot.docs.forEach((doc) => {
          const unread = doc.data().unreadCount?.[user.uid] || 0;
          total += unread;
        });
        setUnreadMessages(total);
      }, () => setUnreadMessages(0));
    }

    // 2.3 Qualifications (Operator requests for qualification)
    const qQualifications = query(
      collection(firestore, 'qualificationApplications'),
      where('status', 'in', ['pending', 'Pending']),
      limit(100)
    );
    const unsubQualifications = onSnapshot(qQualifications, (snapshot) => {
      setPendingQualifications(snapshot.size);
    }, () => setPendingQualifications(0));

    // 2.4 Tickets (Scoped to Assigned Admins and Super Admins)
    const qTickets = query(
      collection(firestore, 'tickets'),
      where('status', 'in', ['Open', 'open', 'In Progress', 'in_progress', 'pending', 'Pending']),
      limit(100)
    );
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      if (isSuperAdmin) {
        setOpenTickets(snapshot.size);
      } else {
        const assignedSet = new Set(assignedOperators);
        const count = snapshot.docs.filter((doc) => assignedSet.has(doc.data().operatorId)).length;
        setOpenTickets(count);
      }
    }, () => setOpenTickets(0));

    // 2.5 Franchise Applications
    const qFranchise = query(
      collection(firestore, 'franchiseApplications'),
      where('status', 'in', ['pending', 'Pending']),
      limit(100)
    );
    const unsubFranchise = onSnapshot(qFranchise, (snapshot) => {
      setPendingApps(snapshot.size);
    }, () => setPendingApps(0));

    // 2.6 Consultations (Pending franchise consultations)
    const qAppointments = query(
      collection(firestore, 'appointments'),
      where('type', '==', 'franchise_consultation'),
      limit(100)
    );
    const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
      const pending = snapshot.docs.filter((doc) => {
        const s = (doc.data().status || '').toLowerCase();
        return s === 'pending';
      });
      setPendingAppointments(pending.length);
    }, () => setPendingAppointments(0));

    // 2.7 Inquiry History (Pending or submitted client inquiries)
    const qInquiries = query(
      collection(firestore, 'inquiries'),
      where('archived', '==', false),
      limit(100)
    );
    const unsubInquiries = onSnapshot(qInquiries, (snapshot) => {
      const pending = snapshot.docs.filter((doc) => {
        const s = (doc.data().status || '').toLowerCase();
        return s === 'pending' || s === 'submitted';
      });
      setPendingInquiries(pending.length);
    }, () => setPendingInquiries(0));

    return () => {
      clearInterval(interval);
      unsubAnnouncements();
      unsubMessages();
      unsubQualifications();
      unsubTickets();
      unsubFranchise();
      unsubAppointments();
      unsubInquiries();
    };
  }, [user?.uid, isSuperAdmin, assignedOperators, location.pathname]);

  const totalOperators = activeOperators + disabledOperators;
  const totalServices = activeServices + disabledServices;

  // Strict map of tab notifications: only the 7 allowed tabs have badges
  const tabNotifications = useMemo(() => ({
    '/admin': 0,
    '/admin/services': 0,
    '/admin/workflow-templates': 0,
    '/admin/operators': 0,
    '/admin/admins': 0,
    '/admin/clients': 0,
    '/admin/resources': 0,
    '/admin/quick-links': 0,
    '/admin/chatbot': 0,
    '/admin/announcements': announcementsCount,
    '/admin/messages': unreadMessages,
    '/admin/qualifications': pendingQualifications,
    '/admin/tickets': openTickets,
    '/admin/franchise-apps': pendingApps,
    '/admin/appointments': pendingAppointments,
    '/admin/inquiry-history': pendingInquiries,
  }), [
    announcementsCount,
    unreadMessages,
    pendingQualifications,
    openTickets,
    pendingApps,
    pendingAppointments,
    pendingInquiries
  ]);

  return (
    <AppLayout
      portalName="Admin"
      portalSubtitle="Management Portal"
      navLinks={navLinks}
      tabNotifications={tabNotifications}
      statCards={
        <>
          {/* ── Revenue ── */}
          <KpiCard
            title="Total Revenue"
            value="—"
            detail="Revenue tracking not yet configured"
            icon="fa-solid fa-peso-sign"
            iconColor="#16a34a"
            badge="Placeholder"
            badgeType="neutral"
          />

          {/* ── Active Services ── */}
          <KpiCard
            title="Active Services"
            value={activeServices}
            detail={`${totalServices} service${totalServices !== 1 ? 's' : ''} in catalog`}
            icon="fa-regular fa-file-lines"
            iconColor="#3b82f6"
            badge={disabledServices > 0 ? `${disabledServices} Disabled` : 'All Active'}
            badgeType={disabledServices > 0 ? 'warn' : 'ok'}
          />

          {/* ── Clients ── */}
          <KpiCard
            title="Clients"
            value={clients}
            detail="Registered client accounts"
            icon="fa-solid fa-user-group"
            iconColor="#a855f7"
            badge={clients > 0 ? `${clients} registered` : 'No clients yet'}
            badgeType={clients > 0 ? 'info' : 'neutral'}
          />

          {/* ── Operators ── */}
          <KpiCard
            title="Operators"
            value={activeOperators}
            detail={`${totalOperators} total franchise branch${totalOperators !== 1 ? 'es' : ''}`}
            icon="fa-solid fa-people-group"
            iconColor="#f0653e"
            badge={
              pendingApps > 0 ? `${pendingApps} App${pendingApps !== 1 ? 's' : ''} Pending`
                : disabledOperators > 0 ? `${disabledOperators} Inactive` : 'All Active'
            }
            badgeType={
              pendingApps > 0
                ? 'warn'
                : disabledOperators > 0
                  ? 'warn'
                  : 'ok'
            }
          />
        </>
      }
    >
      <Outlet />
    </AppLayout>
  );
}
