import './admin-dashboard.css';
import StatCards from '../../../components/AdminComponents/StatCards/StatCards';

export default function Dashboard() {
  return (
    <div className="dashboard">

      <div className="dashboard-stats">
        <StatCards
          icon={<i class="fa-solid fa-peso-sign"></i>}
          title="Total Revenue"
          value="00,00"
          subtitle="This month"
        />

        <StatCards
          icon={<i class="fa-solid fa-bell-concierge"></i>}
          title="Active Services"
          value="0"
          subtitle="Total service"
        />

        <StatCards
          icon={<i class="fa-solid fa-user-group"></i>}
          title="Clients"
          value="0"
          subtitle="Total Clients"
        />

        <StatCards
          icon={<i class="fa-solid fa-users-gear"></i>}
          title="Operators"
          value="1"
          subtitle="Franchise branches"
        />
      </div>

    </div>
  );
}