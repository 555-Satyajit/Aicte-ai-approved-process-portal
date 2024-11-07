import React from 'react';
import { Activity, DollarSign, Users, FileText, ArrowUpRight, ArrowDownRight, Bell } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';

const recentActivity = [
  { id: 1, action: 'Document uploaded', user: 'John Doe', time: '2 hours ago' },
  { id: 2, action: 'User account created', user: 'Jane Smith', time: '4 hours ago' },
  { id: 3, action: 'Report generated', user: 'Mike Johnson', time: 'Yesterday' },
];

const data = [
  { name: 'Jan', uv: 400 },
  { name: 'Feb', uv: 300 },
  { name: 'Mar', uv: 200 },
  { name: 'Apr', uv: 278 },
  { name: 'May', uv: 189 },
  { name: 'Jun', uv: 239 },
  { name: 'Jul', uv: 349 },
  { name: 'Aug', uv: 200 },
];

const DashboardOverview = () => {
  return (
    <div className="container py-5">
      <h1 className="display-4 mb-5">Dashboard Overview</h1>
      
      <div className="row">
        <StatCard title="Total Users" value="1,234" icon={<Users className="h-8 w-8" />} change={5.7} />
        <StatCard title="Documents" value="567" icon={<FileText className="h-8 w-8" />} change={-2.3} />
        <StatCard title="PENDING" value="400" icon={<DollarSign className="h-8 w-8" />} change={10.5} />
        <StatCard title="Activity" value="890" icon={<Activity className="h-8 w-8" />} change={3.2} />
      </div>

      <div className="row mt-4">
        <div className="col-lg-8 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="h5">Monthly Overview</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="uv" stroke="#8884d8" strokeWidth={2} />
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 mb-4">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="h5">Recent Activity</h2>
              <ul className="list-unstyled">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="d-flex align-items-start mb-3">
                    <span className="badge bg-primary rounded-circle me-3"></span>
                    <div>
                      <p className="mb-0 font-weight-bold">{activity.action}</p>
                      <p className="small text-muted">{activity.user} - {activity.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <button 
        className="btn btn-primary rounded-circle shadow-lg position-fixed bottom-0 end-0 m-4"
        onClick={() => alert("You have 3 new notifications.")}
      >
        <Bell className="h-6 w-6" />
      </button>
    </div>
  );
};

const StatCard = ({ title, value, icon, change }) => {
  const isPositive = change >= 0;
  return (
    <div className="col-md-6 col-lg-3 mb-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">{title}</h5>
            {icon}
          </div>
          <h3 className="card-text">{value}</h3>
          <div className={`d-flex align-items-center ${isPositive ? 'text-success' : 'text-danger'}`}>
            {isPositive ? <ArrowUpRight className="me-2" /> : <ArrowDownRight className="me-2" />}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
