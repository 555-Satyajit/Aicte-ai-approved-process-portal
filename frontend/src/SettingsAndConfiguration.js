import React, { useState } from 'react';
import { Save, Bell, Lock, Mail } from 'lucide-react';

const SettingsAndConfiguration = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    twoFactor: false,
    emailFrequency: 'daily',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings saved:', settings);
    // Here you would typically send the settings to your backend
  };

  return (
    <div className="settings-configuration">
      <h2 className="text-2xl font-bold mb-4">Settings and Configuration</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            <span className="mr-2">Enable Notifications</span>
            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            <span className="mr-2">Enable Two-Factor Authentication</span>
            <input
              type="checkbox"
              name="twoFactor"
              checked={settings.twoFactor}
              onChange={handleChange}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            <span className="mr-2">Email Frequency</span>
            <select
              name="emailFrequency"
              value={settings.emailFrequency}
              onChange={handleChange}
              className="form-select mt-1 block w-full"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
          <Save className="w-4 h-4 inline-block mr-2" />
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default SettingsAndConfiguration;