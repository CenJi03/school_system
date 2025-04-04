// src/services/curriculum.js

import api from './api';

const curriculumService = {
  // Get all courses
  getCourses: async (params = {}) => {
    try {
      const response = await api.get('/curriculum/courses/', { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch courses. Please try again.'
      );
    }
  },
  
  // Get course by ID
  getCourse: async (courseId) => {
    try {
      const response = await api.get(`/curriculum/courses/${courseId}/`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch course details. Please try again.'
      );
    }
  },
  
  // Create new course
  createCourse: async (courseData) => {
    try {
      const response = await api.post('/curriculum/courses/', courseData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to create course. Please try again.'
      );
    }
  },
  
  // Update course
  updateCourse: async (courseId, courseData) => {
    try {
      const response = await api.put(`/curriculum/courses/${courseId}/`, courseData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to update course. Please try again.'
      );
    }
  },
  
  // Delete course
  deleteCourse: async (courseId) => {
    try {
      await api.delete(`/curriculum/courses/${courseId}/`);
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to delete course. Please try again.'
      );
    }
  },
  
  // Get lessons for a course
  getLessons: async (courseId) => {
    try {
      const response = await api.get(`/curriculum/courses/${courseId}/lessons/`);
      return response.data.results || response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch lessons. Please try again.'
      );
    }
  },
  
  // Get lesson by ID
  getLesson: async (lessonId) => {
    try {
      const response = await api.get(`/curriculum/lessons/${lessonId}/`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch lesson details. Please try again.'
      );
    }
  },
  
  // Create new lesson
  createLesson: async (courseId, lessonData) => {
    try {
      const response = await api.post(`/curriculum/courses/${courseId}/lessons/`, lessonData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to create lesson. Please try again.'
      );
    }
  },
  
  // Update lesson
  updateLesson: async (lessonId, lessonData) => {
    try {
      const response = await api.put(`/curriculum/lessons/${lessonId}/`, lessonData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to update lesson. Please try again.'
      );
    }
  },
  
  // Delete lesson
  deleteLesson: async (lessonId) => {
    try {
      await api.delete(`/curriculum/lessons/${lessonId}/`);
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to delete lesson. Please try again.'
      );
    }
  },
  
  // Get materials for a lesson
  getMaterials: async (lessonId) => {
    try {
      const response = await api.get(`/curriculum/lessons/${lessonId}/materials/`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to fetch materials. Please try again.'
      );
    }
  },
  
  // Upload material
  uploadMaterial: async (lessonId, materialData, onProgress) => {
    try {
      const formData = new FormData();
      
      // Add file to form data
      if (materialData.file) {
        formData.append('file', materialData.file);
      }
      
      // Add other material data
      Object.keys(materialData).forEach(key => {
        if (key !== 'file') {
          formData.append(key, materialData[key]);
        }
      });
      
      const response = await api.upload(
        `/curriculum/lessons/${lessonId}/materials/`,
        formData,
        onProgress
      );
      
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to upload material. Please try again.'
      );
    }
  },
  
  // Delete material
  deleteMaterial: async (materialId) => {
    try {
      await api.delete(`/curriculum/materials/${materialId}/`);
      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Failed to delete material. Please try again.'
      );
    }
  }
};

export default curriculumService;