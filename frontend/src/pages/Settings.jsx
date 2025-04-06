import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CheckboxInput } from '../components/forms/FormInputs';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { THEME_CONFIG, FEATURES } from '../config';
import toast from 'react-hot-toast';
import '../assets/styles/Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      browser: true,
      sms: false
    },
    privacy: {
      showProfile: true,
      showProgress: true
    },
    appearance: {
      theme: THEME_CONFIG.DEFAULT_THEME,
      fontSize: 'medium'
    },
    language: 'en'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/user/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load your settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle checkbox changes
  const handleCheckboxChange = (category, setting) => (e) => {
    const { checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: checked
      }
    }));
  };

  // Handle select/dropdown changes
  const handleSelectChange = (category, setting) => (e) => {
    const { value } = e.target;
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  // Handle direct setting changes
  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiService.put('/user/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save your settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="o-page o-page--settings">
      <header className="o-page__header">
        <h1>Settings</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <div className="o-settings-layout">
        {/* Notifications Settings */}
        <Card 
          variant="default" 
          title="Notification Preferences" 
          className="o-settings-card"
        >
          <div className="o-settings-section">
            {FEATURES.ENABLE_NOTIFICATIONS && (
              <>
                <CheckboxInput
                  name="email_notifications"
                  label="Email Notifications"
                  checked={settings.notifications.email}
                  onChange={handleCheckboxChange('notifications', 'email')}
                />
                
                <CheckboxInput
                  name="browser_notifications"
                  label="Browser Notifications"
                  checked={settings.notifications.browser}
                  onChange={handleCheckboxChange('notifications', 'browser')}
                />
                
                <CheckboxInput
                  name="sms_notifications"
                  label="SMS Notifications"
                  checked={settings.notifications.sms}
                  onChange={handleCheckboxChange('notifications', 'sms')}
                />
              </>
            )}
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card 
          variant="default" 
          title="Privacy Settings" 
          className="o-settings-card"
        >
          <div className="o-settings-section">
            <CheckboxInput
              name="show_profile"
              label="Allow others to view my profile"
              checked={settings.privacy.showProfile}
              onChange={handleCheckboxChange('privacy', 'showProfile')}
            />
            
            <CheckboxInput
              name="show_progress"
              label="Share my learning progress"
              checked={settings.privacy.showProgress}
              onChange={handleCheckboxChange('privacy', 'showProgress')}
            />
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card 
          variant="default" 
          title="Appearance" 
          className="o-settings-card"
        >
          <div className="o-settings-section">
            {FEATURES.ENABLE_DARK_MODE && (
              <div className="o-form-group">
                <label htmlFor="theme" className="o-form-label">Theme</label>
                <select
                  id="theme"
                  className="o-form-control"
                  value={settings.appearance.theme}
                  onChange={handleSelectChange('appearance', 'theme')}
                >
                  {THEME_CONFIG.AVAILABLE_THEMES.map(theme => (
                    <option key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="o-form-group">
              <label htmlFor="fontSize" className="o-form-label">Font Size</label>
              <select
                id="fontSize"
                className="o-form-control"
                value={settings.appearance.fontSize}
                onChange={handleSelectChange('appearance', 'fontSize')}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Language Settings */}
        <Card 
          variant="default" 
          title="Language" 
          className="o-settings-card"
        >
          <div className="o-settings-section">
            <div className="o-form-group">
              <label htmlFor="language" className="o-form-label">Preferred Language</label>
              <select
                id="language"
                name="language"
                className="o-form-control"
                value={settings.language}
                onChange={handleSettingChange}
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Account Settings */}
        <Card 
          variant="default" 
          title="Account Settings" 
          className="o-settings-card"
        >
          <div className="o-settings-section">
            <Button variant="secondary" as="a" href="/change-password">
              Change Password
            </Button>
            
            <hr className="o-divider" />
            
            <div className="o-danger-zone">
              <h3>Danger Zone</h3>
              <Button variant="danger">
                Deactivate Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
