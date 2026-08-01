import './admin-dashboard.css';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import AlertBar from '../../../components/UI/AlertBar/AlertBar';

// Placeholder data — replace with real Firestore aggregates later
const revenueData = [
  { month: 'Jan', revenue: 185000 },
  { month: 'Feb', revenue: 210000 },
  { month: 'Mar', revenue: 195000 },
  { month: 'Apr', revenue: 240000 },
  { month: 'May', revenue: 220000 },
  { month: 'Jun', revenue: 260000 },
  { month: 'Jul', revenue: 275000 },
  { month: 'Aug', revenue: 250000 },
  { month: 'Sep', revenue: 290000 },
  { month: 'Oct', revenue: 310000 },
  { month: 'Nov', revenue: 295000 },
  { month: 'Dec', revenue: 330000 },
];

const servicesCompletedData = [
  { month: 'Jan', completed: 32 },
  { month: 'Feb', completed: 41 },
  { month: 'Mar', completed: 38 },
  { month: 'Apr', completed: 50 },
  { month: 'May', completed: 47 },
  { month: 'Jun', completed: 55 },
  { month: 'Jul', completed: 60 },
  { month: 'Aug', completed: 58 },
  { month: 'Sep', completed: 63 },
  { month: 'Oct', completed: 70 },
  { month: 'Nov', completed: 66 },
  { month: 'Dec', completed: 75 },
];

export default function Dashboard() {

  return (
    <div className="dashboard">

    <AlertBar message="Welcome to the Admin Dashboard! Here you can monitor key metrics, manage services, and review franchise applications." type="info" />

      <section className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₱${val / 1000}k`} />
              <Tooltip formatter={(val) => [`₱${val.toLocaleString()}`, 'Revenue']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#16a34a"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Services Completed</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicesCompletedData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}