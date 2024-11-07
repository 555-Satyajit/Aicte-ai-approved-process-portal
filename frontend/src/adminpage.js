import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartPie, 
  faUsers, 
  faBell, 
  faChartLine, 
  faCog, 
  faQuestionCircle, 
  faSun, 
  faMoon, 
  faSave,
  faFileAlt,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Import your components here
import AdminDashboard from './DOC';
import DashboardOverview from './DashboardOverview';
import UserManagement from './UserManagement';
import NotificationsPanel from './NotificationsPanel';
import AnalyticsAndReporting from './AnalyticsAndReporting';
import ActivityLog from './ActivityLog';
import SettingsAndConfiguration from './SettingsAndConfiguration';
import HelpAndSupport from './HelpAndSupport';

// Import the CSS file
import './ExpandedAdminDashboard.css';

const InnovativeAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:5000/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'documents':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement users={users} />;
      case 'notifications':
        return <NotificationsPanel notifications={notifications} />;
      case 'analytics':
        return <AnalyticsAndReporting />;
      case 'activity':
        return <ActivityLog />;
      case 'settings':
        return <SettingsAndConfiguration />;
      case 'help':
        return <HelpAndSupport />;
      default:
        return <DashboardOverview />;
    }
  };

  const navItems = [
    { name: 'Overview', icon: faChartPie },
    { name: 'Documents', icon: faFileAlt },
    { name: 'Users', icon: faUsers },
    { name: 'Notifications', icon: faBell },
    { name: 'Analytics', icon: faChartLine },
    { name: 'Activity', icon: faChartLine },
    { name: 'Settings', icon: faCog },
    { name: 'Help', icon: faQuestionCircle }
  ];

  return (
    <div className={`innovative-admin-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <Container fluid>
        <Row>
          <Col md={3} lg={2} className="dashboard-sidebar">
            <div className="sidebar-header">
              <h1 className="dashboard-title">Admin</h1>
              <Button variant="link" className="menu-toggle d-md-none" onClick={toggleMenu}>
                <FontAwesomeIcon icon={faBars} />
              </Button>
            </div>
            <Nav className={`flex-column dashboard-nav ${menuOpen ? 'open' : ''}`}>
              {navItems.map((item) => (
                <Nav.Link
                  key={item.name.toLowerCase()}
                  onClick={() => setActiveTab(item.name.toLowerCase())}
                  active={activeTab === item.name.toLowerCase()}
                  className="nav-link-custom"
                >
                  <FontAwesomeIcon icon={item.icon} className="nav-icon" />
                  <span className="nav-text">{item.name}</span>
                </Nav.Link>
              ))}
            </Nav>
          </Col>
          <Col md={9} lg={10} className="dashboard-main">
            <header className="dashboard-header">
              <div className="header-actions">
                <Button variant="outline-primary" onClick={toggleDarkMode}>
                  <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
                </Button>
                <Button variant="primary" className="save-btn">
                  <FontAwesomeIcon icon={faSave} className="btn-icon" />
                  Save Changes
                </Button>
              </div>
            </header>
            <main className="content-area">
              <Card>
                <Card.Body>
                  {renderTabContent()}
                </Card.Body>
              </Card>
            </main>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InnovativeAdminDashboard;