import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    profile_image: ''
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/user/profile');
        const userData = response.data;
        setProfile(userData);
        setOriginalProfile(userData);
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load your profile');
        // Fallback to local user data if API call fails
        if (user) {
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            bio: user.bio || '',
            profile_image: user.profile_image || ''
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, profile_image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile(profile);
      setOriginalProfile(profile);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setProfile(originalProfile);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="o-page o-page--profile">
      <header className="o-page__header">
        <h1>User Profile</h1>
        <div className="o-page__actions">
          {!editing ? (
            <Button 
              variant="primary" 
              onClick={() => setEditing(true)}
            >
              <i className="fa fa-edit"></i> Edit Profile
            </Button>
          ) : (
            <div className="o-button-group">
              <Button 
                variant="light"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="o-profile-layout">
        <Card variant="default" className="o-profile-card">
          <div className="o-profile-header">
            <div className="o-profile-image-container">
              {profile.profile_image ? (
                <img 
                  src={profile.profile_image} 
                  alt="Profile" 
                  className="o-profile-image"
                />
              ) : (
                <div className="o-profile-image-placeholder">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              
              {editing && (
                <label htmlFor="profile_image" className="o-profile-image-edit">
                  <i className="fa fa-camera"></i>
                  <input 
                    type="file"
                    id="profile_image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="o-visually-hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="o-profile-info">
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  className="o-form-control o-profile-name-input"
                  placeholder="Your Name"
                />
              ) : (
                <h2 className="o-profile-name">{profile.name}</h2>
              )}
              <div className="o-profile-role">{user?.role}</div>
            </div>
          </div>
          
          <div className="o-profile-body">
            <form className="o-form">
              <div className="o-form-group">
                <label className="o-form-label">Email</label>
                {editing ? (
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="o-form-control"
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <div className="o-profile-field">{profile.email}</div>
                )}
              </div>
              
              <div className="o-form-group">
                <label className="o-form-label">Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleChange}
                    className="o-form-control"
                    placeholder="Phone number"
                  />
                ) : (
                  <div className="o-profile-field">
                    {profile.phone || 'Not provided'}
                  </div>
                )}
              </div>
              
              <div className="o-form-group">
                <label className="o-form-label">Bio</label>
                {editing ? (
                  <textarea
                    name="bio"
                    value={profile.bio || ''}
                    onChange={handleChange}
                    className="o-form-control"
                    rows={4}
                    placeholder="Tell us about yourself"
                  />
                ) : (
                  <div className="o-profile-field o-profile-bio">
                    {profile.bio || 'No bio provided'}
                  </div>
                )}
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
