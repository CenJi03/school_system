import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Schedule = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [schedule, setSchedule] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(isAdmin ? '' : user?.id);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isNewEvent, setIsNewEvent] = useState(true);
  
  // Form state for creating/editing schedule
  const [formData, setFormData] = useState({
    course_id: '',
    day: '',
    start_time: '',
    end_time: '',
    room_id: '',
    teacher_id: isAdmin ? '' : user?.id,
    recurring: true
  });
  
  // Days of week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Time slots
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];
  
  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoading(true);
      try {
        // Construct query params based on filters
        const params = {};
        if (selectedTeacher) {
          params.teacher_id = selectedTeacher;
        }
        if (selectedDate) {
          params.date = selectedDate;
        }
        
        const response = await apiService.get('/staff/schedule/', { params });
        setSchedule(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScheduleData();
  }, [selectedTeacher, selectedDate]);
  
  // Fetch form options (teachers, courses, rooms)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [teachersResponse, coursesResponse, roomsResponse] = await Promise.all([
          apiService.get('/staff/', { params: { role: 'teacher', limit: 100 } }),
          apiService.get('/curriculum/courses/', { params: { status: 'active', limit: 100 } }),
          apiService.get('/facilities/rooms/')
        ]);
        
        setTeachers(teachersResponse.data.results || teachersResponse.data);
        setCourses(coursesResponse.data.results || coursesResponse.data);
        setRooms(roomsResponse.data);
      } catch (error) {
        console.error('Error fetching options:', error);
        toast.error('Failed to load form options');
      }
    };
    
    fetchOptions();
  }, []);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'recurring' ? e.target.checked : value
    });
  };
  
  // Open modal to create new event
  const openCreateModal = (day, time) => {
    setIsNewEvent(true);
    setFormData({
      ...formData,
      day,
      start_time: time,
      end_time: incrementTime(time)
    });
    setIsModalOpen(true);
  };
  
  // Open modal to edit existing event
  const openEditModal = (event) => {
    setIsNewEvent(false);
    setSelectedEvent(event);
    setFormData({
      course_id: event.course.id,
      day: event.day,
      start_time: event.start_time,
      end_time: event.end_time,
      room_id: event.room.id,
      teacher_id: event.teacher.id,
      recurring: event.recurring
    });
    setIsModalOpen(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isNewEvent) {
        await apiService.post('/staff/schedule/', formData);
        toast.success('Class scheduled successfully');
      } else {
        await apiService.put(`/staff/schedule/${selectedEvent.id}/`, formData);
        toast.success('Schedule updated successfully');
      }
      
      // Refresh schedule data
      setIsModalOpen(false);
      const params = {};
      if (selectedTeacher) {
        params.teacher_id = selectedTeacher;
      }
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      const response = await apiService.get('/staff/schedule/', { params });
      setSchedule(response.data.results || response.data);
      
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };
  
  // Handle event deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/staff/schedule/${selectedEvent.id}/`);
      toast.success('Schedule deleted successfully');
      
      // Refresh schedule data
      setIsModalOpen(false);
      const params = {};
      if (selectedTeacher) {
        params.teacher_id = selectedTeacher;
      }
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      const response = await apiService.get('/staff/schedule/', { params });
      setSchedule(response.data.results || response.data);
      
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };
  
  // Increment time by 1 hour
  const incrementTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = hours + 1 > 23 ? 23 : hours + 1;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Get event for specific day and time
  const getEvent = (day, time) => {
    return schedule.find(event => 
      event.day === day && 
      event.start_time <= time && 
      event.end_time > time
    );
  };
  
  // Get event duration in hours
  const getEventDuration = (event) => {
    const startHour = parseInt(event.start_time.split(':')[0]);
    const endHour = parseInt(event.end_time.split(':')[0]);
    return endHour - startHour;
  };
  
  // Check if cell is the first cell of an event
  const isEventStart = (day, time) => {
    const event = getEvent(day, time);
    return event && event.start_time === time;
  };
  
  // Check if cell should be rendered (not part of a multi-hour event)
  const shouldRenderCell = (day, time) => {
    const event = getEvent(day, time);
    if (!event) return true;
    return event.start_time === time;
  };
  
  // Format time for display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };
  
  return (
    <div className="o-page o-page--schedule">
      <header className="o-page__header">
        <h1>Class Schedule</h1>
        {isAdmin && (
          <div className="o-page__actions">
            <Button 
              variant="primary"
              onClick={() => {
                setIsNewEvent(true);
                setFormData({
                  course_id: '',
                  day: 'Monday',
                  start_time: '09:00',
                  end_time: '10:00',
                  room_id: '',
                  teacher_id: '',
                  recurring: true
                });
                setIsModalOpen(true);
              }}
            >
              <i className="fa fa-plus"></i> Add Class
            </Button>
          </div>
        )}
      </header>
      
      <Card variant="default">
        <div className="o-filter-controls">
          <div className="o-form-row">
            {isAdmin && (
              <div className="o-form-group">
                <label htmlFor="teacher" className="o-form-label">Teacher</label>
                <select
                  id="teacher"
                  className="o-form-control"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="">All Teachers</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="o-form-group">
              <label htmlFor="date" className="o-form-label">Date</label>
              <input
                type="date"
                id="date"
                className="o-form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="o-form-group o-form-group--buttons">
              <Button 
                variant="light"
                onClick={() => {
                  setSelectedTeacher(isAdmin ? '' : user?.id);
                  setSelectedDate('');
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="o-loading-container">
            <div className="o-loading__spinner"></div>
            <p>Loading schedule...</p>
          </div>
        ) : (
          <div className="o-schedule">
            <div className="o-schedule__table">
              <div className="o-schedule__header">
                <div className="o-schedule__time-cell"></div>
                {days.map(day => (
                  <div key={day} className="o-schedule__day-cell">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="o-schedule__body">
                {timeSlots.map(time => (
                  <div key={time} className="o-schedule__row">
                    <div className="o-schedule__time-cell">
                      {formatTime(time)}
                    </div>
                    {days.map(day => (
                      shouldRenderCell(day, time) ? (
                        <div 
                          key={`${day}-${time}`}
                          className={`o-schedule__cell ${isEventStart(day, time) ? 'o-schedule__cell--event-start' : ''}`}
                          onClick={() => {
                            if (!getEvent(day, time)) {
                              openCreateModal(day, time);
                            }
                          }}
                          style={{
                            gridRowEnd: isEventStart(day, time) ? 
                              `span ${getEventDuration(getEvent(day, time))}` : undefined
                          }}
                        >
                          {isEventStart(day, time) && (
                            <div 
                              className={`o-schedule-event o-schedule-event--${getEvent(day, time).course.level.toLowerCase()}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(getEvent(day, time));
                              }}
                            >
                              <div className="o-schedule-event__course">
                                {getEvent(day, time).course.name}
                              </div>
                              <div className="o-schedule-event__details">
                                <div>
                                  <i className="fa fa-user-tie"></i> {getEvent(day, time).teacher.name}
                                </div>
                                <div>
                                  <i className="fa fa-map-marker-alt"></i> {getEvent(day, time).room.name}
                                </div>
                                <div>
                                  <i className="fa fa-clock"></i> {formatTime(getEvent(day, time).start_time)} - {formatTime(getEvent(day, time).end_time)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : <div key={`${day}-${time}`}></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Create/Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isNewEvent ? 'Add Class Schedule' : 'Edit Class Schedule'}
        footer={
          <>
            {!isNewEvent && (
              <Button 
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
            <div className="o-modal__actions-right">
              <Button 
                variant="light"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleSubmit}
              >
                {isNewEvent ? 'Add Schedule' : 'Save Changes'}
              </Button>
            </div>
          </>
        }
      >
        <form className="o-form">
          <div className="o-form-group">
            <label htmlFor="course_id" className="o-form-label">Course</label>
            <select
              id="course_id"
              name="course_id"
              className="o-form-control"
              value={formData.course_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.level})
                </option>
              ))}
            </select>
          </div>
          
          {isAdmin && (
            <div className="o-form-group">
              <label htmlFor="teacher_id" className="o-form-label">Teacher</label>
              <select
                id="teacher_id"
                name="teacher_id"
                className="o-form-control"
                value={formData.teacher_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="day" className="o-form-label">Day</label>
              <select
                id="day"
                name="day"
                className="o-form-control"
                value={formData.day}
                onChange={handleChange}
                required
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="o-form-group">
              <label htmlFor="room_id" className="o-form-label">Classroom</label>
              <select
                id="room_id"
                name="room_id"
                className="o-form-control"
                value={formData.room_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Classroom</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (Capacity: {room.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="start_time" className="o-form-label">Start Time</label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                className="o-form-control"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="o-form-group">
              <label htmlFor="end_time" className="o-form-label">End Time</label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                className="o-form-control"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="o-form-group o-form-group--checkbox">
            <input
              type="checkbox"
              id="recurring"
              name="recurring"
              checked={formData.recurring}
              onChange={handleChange}
            />
            <label htmlFor="recurring" className="o-form-label">Recurring weekly class</label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schedule;
