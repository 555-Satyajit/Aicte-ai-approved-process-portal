import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, User, FileText, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import './activityLog.css';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Adjust this to match your backend URL
});

const ActivityLog = () => {
  const [summary, setSummary] = useState({
    documents: {
      total: {},
      today: {},
      week: {},
      month: {},
      year: {}
    }
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryResponse, activitiesResponse] = await Promise.all([
          api.get('/api/activity-log/summary'),
          api.get('/api/activity-log/recent')
        ]);
        
        setSummary(summaryResponse.data);
        setActivities(activitiesResponse.data.activities);
      } catch (error) {
        console.error('Error fetching activity log data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60 * 1000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="icon-green" />;
      case 'rejected':
        return <XCircle className="icon-red" />;
      case 'pending':
        return <AlertCircle className="icon-yellow" />;
      default:
        return <Clock className="icon-blue" />;
    }
  };

  const StatCard = ({ title, stats, icon, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-content">
        <div>
          <h3 className="stat-card-title">{title}</h3>
          <div className="stat-grid">
            {Object.entries(stats).map(([period, count]) => (
              <div key={period} className="stat-item">
                <p className="stat-period">{period}</p>
                <p className="stat-count">{count}</p>
              </div>
            ))}
          </div>
        </div>
        {icon}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Loader className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="activity-log">
      <h2 className="activity-log-title">Activity Log</h2>
      
      <div className="stat-cards-container">
        <StatCard 
          title="Pending Documents" 
          stats={summary.documents.pending || {}}
          icon={<AlertCircle className="icon-large icon-yellow" />} 
          color="border-yellow"
        />
        <StatCard 
          title="Approved Documents" 
          stats={summary.documents.approved || {}}
          icon={<CheckCircle className="icon-large icon-green" />} 
          color="border-green"
        />
        <StatCard 
          title="Rejected Documents" 
          stats={summary.documents.rejected || {}}
          icon={<XCircle className="icon-large icon-red" />} 
          color="border-red"
        />
      </div>
      
      <div className="recent-activities">
        <h3 className="recent-activities-title">Recent Activities</h3>
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              {getIcon(activity.action.split(' ')[0])}
              <div className="activity-details">
                <p className="activity-action">{activity.action}</p>
                <p className="activity-user">
                  <User className="icon-small" />
                  {activity.user} - {activity.target}
                </p>
                <p className="activity-doc-id">
                  <FileText className="icon-small" />
                  Document ID: {activity.id}
                </p>
                <p className="activity-timestamp">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-activities">No recent activities</p>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;