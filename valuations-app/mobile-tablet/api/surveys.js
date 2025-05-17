import apiClient from './client';

/**
 * Survey related API methods
 */
const surveysApi = {
  /**
   * Get list of surveys for authenticated user
   * @returns {Promise<Object>} Response with surveys array
   */
  getSurveys: async () => {
    try {
      return await apiClient.get('/surveys');
    } catch (error) {
      console.error('Get surveys error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Get details of a specific survey
   * @param {string} surveyId - ID of the survey to fetch
   * @returns {Promise<Object>} Response with survey data
   */
  getSurveyDetails: async (surveyId) => {
    try {
      return await apiClient.get(`/surveys/${surveyId}`);
    } catch (error) {
      console.error(`Get survey ${surveyId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Submit a survey to the server
   * @param {Object} survey - Survey data to submit
   * @returns {Promise<Object>} Response with server confirmation
   */
  submitSurvey: async (survey) => {
    try {
      // If survey has an ID and a lastSyncedAt, it's an update
      if (survey.id && survey.lastSyncedAt) {
        return await apiClient.put(`/surveys/${survey.id}`, survey);
      } else {
        return await apiClient.post('/surveys', survey);
      }
    } catch (error) {
      console.error('Submit survey error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Delete a survey from the server
   * @param {string} surveyId - ID of the survey to delete
   * @returns {Promise<Object>} Response with deletion confirmation
   */
  deleteSurvey: async (surveyId) => {
    try {
      return await apiClient.delete(`/surveys/${surveyId}`);
    } catch (error) {
      console.error(`Delete survey ${surveyId} error:`, error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  },

  /**
   * Upload file (photo) to the server
   * @param {string} surveyId - ID of the survey the file belongs to
   * @param {Object} fileData - File data to upload
   * @returns {Promise<Object>} Response with file URL
   */
  uploadFile: async (surveyId, fileData) => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('surveyId', surveyId);
      
      // Use different headers for file upload
      const response = await apiClient.post('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response;
    } catch (error) {
      console.error('File upload error:', error);
      return error.success === false ? error : { success: false, message: error.message };
    }
  }
};

export default surveysApi; 