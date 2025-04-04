import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tab from '../../components/common/Tab';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewStaff = id === 'new' || !id;
  
  // Staff state
  const [staff, setStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    department: '',
    hire_date: '',
    status: 'active',
    address: '',
    qualifications: '',
    bio: '',
    photo_url: ''
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(!isNewStaff);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Fetch staff data
  useEffect(() => {
    const fetchStaffData = async () => {
      if (isNewStaff) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Get staff details
        const response = await apiService.get(`/staff/${id}/`);
        setStaff(response.data);
        
        // Get assigned courses
        const coursesResponse = await apiService.get(`/staff/${id}/courses/`);
        setCourses(coursesResponse.data.results || coursesResponse.data);
        
        // Get schedule
        const scheduleResponse = await apiService.get(`/staff/${id}/schedule/`);
        setSchedule(scheduleResponse.data.results || scheduleResponse.data);
        
      } catch (error) {
        console.error('Error fetching staff data:', error);
        toast.error('Failed to load staff details');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch roles and departments for dropdowns
    const fetchOptions = async () => {
      try {
        const [rolesResponse, departmentsResponse] = await Promise.all([
          apiService.get('/staff/roles/'),
          apiService.get('/staff/departments/')
        ]);
        
        setRoles(rolesResponse.data);
        setDepartments(departmentsResponse.data);
      } catch (error) {
        console.error('Error fetching options:', error);
        toast.error('Failed to load form options');
      }
    };
    
    fetchOptions();
    fetchStaffData();
  }, [id, isNewStaff]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStaff({
      ...staff,
      [name]: value
    });
    
    // Clear validation error when user fixes field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!staff.name) newErrors.name = 'Name is required';
    if (!staff.email) newErrors.email = 'Email is required';
    if (staff.email && !/\S+@\S+\.\S+/.test(staff.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!staff.role) newErrors.role = 'Role is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setSaving(true);
    try {
      let response;
      
      if (isNewStaff) {
        response = await apiService.post('/staff/', staff);
        toast.success('Staff member added successfully');
        navigate(`/staff/${response.data.id}`);
      } else {
        response = await apiService.put(`/staff/${id}/`, staff);
        toast.success('Staff details updated successfully');
        setStaff(response.data);
      }
      
    } catch (error) {
      console.error('Error saving staff data:', error);
      toast.error('Failed to save staff details');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle staff deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/staff/${id}/`);
      toast.success('Staff member deleted successfully');
      navigate('/staff');
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error('Failed to delete staff member');
    }
  };
  
  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setStaff({
        ...staff,
        photo_url: reader.result
      });
    };
    reader.readAsDataURL(file);
  };
  
  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading staff details...</p>
      </div>
    );
  }
  
  return (
    <div className="o-page o-page--staff-detail">
      <header className="o-page__header">
        <div className="o-page__title">
          <h1>{isNewStaff ? 'Add New Staff Member' : staff.name}</h1>
          {!isNewStaff && (
            <span className={`o-tag o-tag--${staff.status.toLowerCase()}`}>
              {staff.status}
            </span>
          )}
        </div>
        <div className="o-page__actions">
          {!isNewStaff && (
            <Button 
              variant="danger"
              onClick={() => setConfirmDelete(true)}
            >
              <i className="fa fa-trash"></i> Delete
            </Button>
          )}
        </div>
      </header>
      
      {!isNewStaff && (
        <div className="o-tabs">
          <Tab
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
          >
            <i className="fa fa-user"></i> Details
          </Tab>
          <Tab
            active={activeTab === 'courses'}
            onClick={() => setActiveTab('courses')}
          >
            <i className="fa fa-book"></i> Courses
          </Tab>
          <Tab
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          >
            <i className="fa fa-calendar"></i> Schedule
          </Tab>
        </div>
      )}
      
      {/* Staff Details Form */}
      {(isNewStaff || activeTab === 'details') && (
        <Card variant="default">
          <form onSubmit={handleSubmit} className="o-form">
            <div className="o-form__grid">
              <div className="o-form__column">
                <div className="o-form-group">
                  <label htmlFor="name" className="o-form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`o-form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={staff.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                  {errors.name && <div className="o-form-error">{errors.name}</div>}
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="email" className="o-form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`o-form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={staff.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                  {errors.email && <div className="o-form-error">{errors.email}</div>}
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="phone" className="o-form-label">Phone Number</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="o-form-control"
                    value={staff.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="o-form-row">
                  <div className="o-form-group">
                    <label htmlFor="role" className="o-form-label">Role</label>
                    <select
                      id="role"
                      name="role"
                      className={`o-form-control ${errors.role ? 'is-invalid' : ''}`}
                      value={staff.role}
                      onChange={handleChange}
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    {errors.role && <div className="o-form-error">{errors.role}</div>}
                  </div>
                  
                  <div className="o-form-group">
                    <label htmlFor="department" className="o-form-label">Department</label>
                    <select
                      id="department"
                      name="department"
                      className="o-form-control"
                      value={staff.department}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="o-form-row">
                  <div className="o-form-group">
                    <label htmlFor="hire_date" className="o-form-label">Hire Date</label>
                    <input
                      type="date"
                      id="hire_date"
                      name="hire_date"
                      className="o-form-control"
                      value={staff.hire_date}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="o-form-group">
                    <label htmlFor="status" className="o-form-label">Status</label>
                    <select
                      id="status"
                      name="status"
                      className="o-form-control"
                      value={staff.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </div>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="address" className="o-form-label">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    className="o-form-control"
                    value={staff.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter address"
                  ></textarea>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="qualifications" className="o-form-label">Qualifications</label>
                  <textarea
                    id="qualifications"
                    name="qualifications"
                    className="o-form-control"
                    value={staff.qualifications}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter qualifications"
                  ></textarea>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="bio" className="o-form-label">Biography</label>
                  <textarea
                    id="bio"
                    name="bio"
                    className="o-form-control"
                    value={staff.bio}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter staff biography"
                  ></textarea>
                </div>
              </div>
              
              <div className="o-form__column">
                <div className="o-form-group">
                  <label className="o-form-label">Profile Photo</label>
                  <div className="o-photo-upload">
                    {staff.photo_url ? (
                      <div className="o-photo-upload__preview">
                        <img src={staff.photo_url} alt="Profile" />
                        <button 
                          type="button"
                          className="o-photo-upload__remove"
                          onClick={() => setStaff({...staff, photo_url: ''})}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="o-photo-upload__placeholder">
                        <i className="fa fa-user"></i>
                        <span>Upload photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="o-photo-upload__input"
                    />
                    <label htmlFor="photo" className="o-btn o-btn--secondary">
                      Choose Photo
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="o-form-actions">
              <Button 
                variant="light"
                type="button"
                onClick={() => navigate('/staff')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="o-spinner o-spinner--small"></span>
                    {isNewStaff ? 'Adding...' : 'Saving...'}
                  </>
                ) : (
                  isNewStaff ? 'Add Staff Member' : 'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Courses Tab Content */}
      {activeTab === 'courses' && (
        <Card 
          variant="default"
          className="o-card--courses"
          title={`Assigned Courses (${courses.length})`}
        >
          {courses.length === 0 ? (
            <div className="o-empty-state">
              <i className="fa fa-book"></i>
              <p>No courses assigned yet</p>
              <Button 
                variant="primary"
                as={Link}
                to="/curriculum/courses/new"
              >
                Assign Course
              </Button>
            </div>
          ) : (
            <div className="o-table-responsive">
              <table className="o-table o-table--hover">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Level</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <Link to={`/curriculum/courses/${course.id}`}>
                          {course.name}
                        </Link>
                      </td>
                      <td>{course.level}</td>
                      <td>{course.student_count}</td>
                      <td>
                        <span className={`o-tag o-tag--${course.status.toLowerCase()}`}>
                          {course.status}
                        </span>
                      </td>
                      <td>
                        <div className="o-table-actions">
                          <Button 
                            variant="icon" 
                            as={Link}
                            to={`/curriculum/courses/${course.id}`}
                          >
                            <i className="fa fa-eye"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      
      {/* Schedule Tab Content */}
      {activeTab === 'schedule' && (
        <Card 
          variant="default" 
          className="o-card--schedule"
          title="Teaching Schedule"
          actions={
            <Button 
              variant="primary" 
              size="small"
              as={Link}
              to="/staff/schedule"
            >
              <i className="fa fa-calendar-plus"></i> Manage Schedule
            </Button>
          }
        >
          {schedule.length === 0 ? (
            <div className="o-empty-state">
              <i className="fa fa-calendar"></i>
              <p>No classes scheduled yet</p>
              <Button 
                variant="primary"
                as={Link}
                to="/staff/schedule"
              >
                Create Schedule
              </Button>
            </div>
          ) : (
            <div className="o-table-responsive">
              <table className="o-table o-table--hover">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link to={`/curriculum/courses/${item.course.id}`}>
                          {item.course.name}
                        </Link>
                      </td>
                      <td>{item.day}</td>
                      <td>{item.start_time} - {item.end_time}</td>
                      <td>{item.room}</td>
                      <td>{item.student_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Staff Member"
        footer={
          <>
            <Button variant="light" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className="o-confirmation-message">
          <i className="fa fa-exclamation-triangle"></i>
          <p>
            Are you sure you want to delete <strong>{staff.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default StaffDetail;
