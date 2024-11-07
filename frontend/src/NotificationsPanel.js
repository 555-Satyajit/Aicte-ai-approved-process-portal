import React, { useState } from 'react';
import { Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckCircle, faExclamationTriangle, faInfoCircle, faTimes, faClock } from '@fortawesome/free-solid-svg-icons';

const NotificationsPanel = () => {
  // Sample notifications, including a pending notification
  const [visibleNotifications, setVisibleNotifications] = useState([
    { type: 'info', message: 'Server update scheduled at 12:00 PM' },
    { type: 'warning', message: 'Low disk space on server #12' },
    { type: 'success', message: 'Backup completed successfully' },
    { type: 'info', message: 'New user registered: doc73' },
    { type: 'warning', message: 'Memory usage exceeded 90% on server #34' },
    { type: 'success', message: 'Security patch applied successfully' },
    { type: 'info', message: 'Meeting scheduled with IT at 3:00 PM' },
  ]);

  const getIcon = (type) => {
    switch (type) {
      case 'info':
        return faInfoCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'success':
        return faCheckCircle;
      case 'pending':
        return faClock; // Icon for pending notifications
      default:
        return faBell;
    }
  };

  const getVariant = (type) => {
    switch (type) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'pending':
        return 'secondary'; // A variant color for pending notifications
      default:
        return 'primary';
    }
  };

  // Function to remove a notification when close button is clicked
  const closeNotification = (index) => {
    const updatedNotifications = visibleNotifications.filter((_, i) => i !== index);
    setVisibleNotifications(updatedNotifications);
  };

  return (
    <Card className="notifications-panel">
      <Card.Header>
        <h2>Notifications</h2>
      </Card.Header>
      <Card.Body>
        <ListGroup>
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((notification, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={getIcon(notification.type)} className={`mr-2 text-${getVariant(notification.type)}`} />
                  {notification.message}
                </div>
                <div className="d-flex align-items-center">
                  <Badge variant={getVariant(notification.type)} pill className="mr-2">
                    {notification.type}
                  </Badge>
                  <Button
                    variant="link"
                    onClick={() => closeNotification(index)}
                    aria-label={`Close notification: ${notification.message}`}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <p>No notifications available</p>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default NotificationsPanel;
