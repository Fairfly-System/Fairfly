import './admin-dashboard.css';
import StatCards from '../../../components/AdminComponents/StatCards/StatCards';

export default function Dashboard() {
  return (
    <div className="dashboard">

      <div className="dashboard-stats">
        <StatCards
          title="Total Revenue"
          value="000,000"
          subtitle="From last month"
          icon="fa-solid fa-peso-sign"
          iconColor="#16a34a"
          subtitleColor="#16a34a"
        />

        <StatCards
          title="Active Services"
          value="0"
          subtitle="Total service"
          icon="fa-regular fa-file-lines"
          iconColor="#3b82f6"
        />

        <StatCards
          title="Clients"
          value="0"
          subtitle="Total clients"
          icon="fa-solid fa-user-group"
          iconColor="#a855f7"
          subtitleColor="#c026d3"
        />

        <StatCards
          title="Operators"
          value="1"
          subtitle="Franchise branches"
          icon="fa-solid fa-people-group"
          iconColor="#f0653e"
        />
      </div>

    </div>
  );
}