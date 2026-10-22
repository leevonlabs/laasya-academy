import React from 'react';
import NotificationsClient from '@/components/notifications/NotificationsClient';

export const metadata = {
  title: 'Notifications & Alerts | Laasya Cultural Academy',
  description: 'View real-time academy alerts, student fee collections, guru salary disbursements, and video shares.'
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
