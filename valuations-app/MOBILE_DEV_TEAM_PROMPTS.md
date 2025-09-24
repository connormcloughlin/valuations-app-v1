# Mobile Development Team - Comprehensive Analysis Prompts

## Overview
This document contains a comprehensive set of prompts to help your mobile development team understand the current Valuations Mobile Tablet App architecture, identify gaps, and plan improvements for surveyor email filtering implementation.

## 1. Current Mobile App Screens/Features Analysis

### 1.1 Screen Structure Analysis
**Prompt**: "Analyze the complete screen structure of the mobile app. Document all screens, their purposes, navigation flow, and user journeys. Include any hidden screens, modal dialogs, or conditional screens that might not be immediately visible."

**Follow-up Questions**:
- Are there any screens that are only accessible under certain conditions?
- What is the complete user flow from login to completing a survey?
- Are there any admin-specific screens that regular users don't see?
- What happens when a user goes offline during a survey?

### 1.2 Feature Completeness Analysis
**Prompt**: "Document all existing features in the mobile app. Identify which features are fully implemented, which are partially implemented, and which might be placeholders. Pay special attention to surveyor-specific functionality."

**Areas to Explore**:
- User profile management and settings
- Offline data synchronization
- Photo and media management
- Survey data validation
- Error handling and recovery

### 1.3 Navigation and User Experience
**Prompt**: "Analyze the navigation patterns, user experience flows, and any UX issues. Document how users move between different sections and what happens when they encounter errors or edge cases."

## 2. Existing API Endpoints and Data Flow

### 2.1 API Endpoint Inventory
**Prompt**: "Create a complete inventory of all API endpoints used by the mobile app. For each endpoint, document the request/response patterns, error handling, and any special behaviors like caching or offline fallbacks."

**Specific Areas**:
- Authentication endpoints and token management
- Appointment-related endpoints (primary and fallback)
- Risk assessment and survey endpoints
- Media upload and management endpoints
- Sync and offline endpoints

### 2.2 Data Flow Analysis
**Prompt**: "Map out the complete data flow from user action to API response. Include how data is cached, synchronized, and what happens during offline scenarios."

**Key Questions**:
- How does the app handle partial data loads?
- What happens when API calls fail?
- How is data synchronized between online and offline states?
- Are there any data consistency issues?

### 2.3 Authentication and User Context
**Prompt**: "Analyze the complete authentication system, user context handling, and how user information flows through the application. Document any security considerations or potential vulnerabilities."

## 3. Offline Capabilities and Gaps

### 3.1 Offline Functionality Analysis
**Prompt**: "Document what works offline, what doesn't, and what the user experience is like when offline. Identify any gaps in offline functionality that could impact surveyor productivity."

**Specific Areas**:
- Can users view their appointments offline?
- Can users continue working on surveys offline?
- What data is cached locally and for how long?
- How does the app handle offline-to-online transitions?

### 3.2 Data Synchronization
**Prompt**: "Analyze the data synchronization system. Document how data is synced, what happens during conflicts, and any potential data loss scenarios."

**Key Questions**:
- What happens if two users modify the same data offline?
- How are conflicts resolved during sync?
- Is there any data that can't be synchronized?
- What happens if sync fails repeatedly?

### 3.3 Offline User Experience
**Prompt**: "Document the offline user experience. What can users do offline, what are the limitations, and how does the app communicate offline status to users?"

## 4. Fallback Logic and Error Handling

### 4.1 Current Fallback Systems
**Prompt**: "Document all existing fallback logic in the mobile app. Identify where fallbacks are used, why they exist, and whether they can be simplified or removed."

**Specific Areas**:
- API endpoint fallbacks (primary vs secondary endpoints)
- Offline fallbacks (cached data vs API data)
- Error handling fallbacks (retry logic, user notifications)
- Authentication fallbacks (token refresh, re-authentication)

### 4.2 Error Handling Patterns
**Prompt**: "Analyze how the app handles errors, network failures, and edge cases. Document the user experience during error scenarios and any recovery mechanisms."

**Key Questions**:
- How does the app handle network timeouts?
- What happens when API endpoints return errors?
- How are users notified of problems?
- What recovery options are available to users?

### 4.3 Performance and Reliability
**Prompt**: "Analyze the performance characteristics of the app, including loading times, memory usage, and any performance bottlenecks."

## 5. Surveyor-Specific Functionality

### 5.1 Current Surveyor Features
**Prompt**: "Document any existing surveyor-specific functionality in the app. Identify what features are available to surveyors and what might be missing."

**Areas to Explore**:
- User role differentiation
- Surveyor-specific screens or features
- Assignment and scheduling functionality
- Progress tracking and reporting

### 5.2 Multi-Surveyor Scenarios
**Prompt**: "Analyze how the app handles scenarios where multiple surveyors might be involved with the same order or property. Document any existing functionality and identify gaps."

**Key Questions**:
- Can multiple surveyors work on the same order?
- How is work divided between surveyors?
- What happens when surveyors are reassigned?
- How is progress tracked across multiple surveyors?

### 5.3 Surveyor Productivity Features
**Prompt**: "Identify features that could improve surveyor productivity and efficiency. Document any existing productivity features and suggest improvements."

## 6. Technical Architecture Deep Dive

### 6.1 Code Organization and Structure
**Prompt**: "Analyze the code organization, component structure, and architectural patterns used in the mobile app. Document any technical debt or areas for improvement."

**Specific Areas**:
- Component reusability and modularity
- State management patterns
- API client architecture
- Database schema and relationships
- Performance optimization opportunities

### 6.2 Security and Data Protection
**Prompt**: "Analyze the security measures in place, data protection mechanisms, and any potential security vulnerabilities."

**Key Areas**:
- Authentication and authorization
- Data encryption and storage
- API security and token management
- User data privacy and compliance

### 6.3 Scalability and Maintenance
**Prompt**: "Assess the scalability of the current architecture and identify areas that might need improvement as the app grows."

## 7. Integration Points and Dependencies

### 7.1 External Dependencies
**Prompt**: "Document all external dependencies, third-party libraries, and integration points. Identify any potential issues or upgrade requirements."

**Areas to Explore**:
- React Native and Expo versions
- Third-party libraries and their versions
- API dependencies and versioning
- Platform-specific dependencies (iOS/Android)

### 7.2 Backend Integration
**Prompt**: "Analyze the integration with backend services, API contracts, and any potential breaking changes or improvements needed."

## 8. User Experience and Accessibility

### 8.1 User Interface Analysis
**Prompt**: "Analyze the user interface design, accessibility features, and user experience patterns. Identify any UX issues or improvements needed."

**Key Areas**:
- Navigation patterns and consistency
- Form design and data entry
- Error messaging and user feedback
- Accessibility compliance

### 8.2 Performance and Usability
**Prompt**: "Assess the overall performance and usability of the app. Identify any bottlenecks or user experience issues."

## 9. Testing and Quality Assurance

### 9.1 Testing Coverage
**Prompt**: "Analyze the current testing strategy, test coverage, and identify areas that need additional testing."

**Areas to Explore**:
- Unit test coverage
- Integration testing
- End-to-end testing
- Offline scenario testing
- Error handling testing

### 9.2 Quality Assurance Processes
**Prompt**: "Document the quality assurance processes, code review practices, and identify areas for improvement."

## 10. Future Considerations and Improvements

### 10.1 Technical Debt
**Prompt**: "Identify technical debt, code quality issues, and areas that need refactoring or improvement."

**Key Areas**:
- Code duplication and reusability
- Performance optimization opportunities
- Architecture improvements
- Maintenance and support considerations

### 10.2 Feature Gaps and Enhancements
**Prompt**: "Identify missing features, user experience improvements, and potential enhancements that could benefit surveyors and the overall system."

## 11. Specific Implementation Questions

### 11.1 Surveyor Email Filtering Implementation
**Prompt**: "Based on the current architecture, what are the specific implementation steps needed to add surveyor email filtering? What changes are needed in the mobile app code?"

**Key Questions**:
- Which files need to be modified?
- What API changes are required?
- How will the user experience change?
- What testing is needed?

### 11.2 Fallback Logic Removal
**Prompt**: "What are the risks and benefits of removing fallback logic? How can we ensure reliability while simplifying the codebase?"

### 11.3 Performance Optimization
**Prompt**: "What performance optimizations can be implemented alongside the surveyor filtering feature? How can we improve the overall app performance?"

## 12. Additional Questions for Complete Understanding

### 12.1 Business Logic Questions
- What are the business rules for surveyor assignments?
- How are appointments created and assigned to surveyors?
- What happens when a surveyor is unavailable or reassigned?
- Are there any compliance or regulatory requirements?

### 12.2 Data Management Questions
- How is surveyor data managed and updated?
- What happens to historical data when surveyors are reassigned?
- How is data integrity maintained across multiple surveyors?
- What backup and recovery procedures exist?

### 12.3 User Management Questions
- How are surveyor accounts created and managed?
- What permissions and access levels exist?
- How is user authentication handled across different devices?
- What happens when a surveyor leaves the organization?

### 12.4 System Integration Questions
- How does the mobile app integrate with other systems?
- What external services or APIs are used?
- How is data synchronized with other applications?
- What are the dependencies on external systems?

## 13. Documentation and Knowledge Transfer

### 13.1 Current Documentation
**Prompt**: "Assess the current documentation quality and identify areas that need improvement or additional documentation."

### 13.2 Knowledge Transfer
**Prompt**: "Identify key knowledge areas that need to be documented for new team members or future maintenance."

## 14. Risk Assessment and Mitigation

### 14.1 Implementation Risks
**Prompt**: "Identify potential risks in implementing surveyor email filtering and suggest mitigation strategies."

### 14.2 Rollback Planning
**Prompt**: "What rollback procedures exist if the implementation causes issues? How can we ensure minimal disruption?"

## 15. Success Metrics and Monitoring

### 15.1 Performance Metrics
**Prompt**: "What metrics should we track to measure the success of the surveyor filtering implementation?"

### 15.2 User Experience Metrics
**Prompt**: "How will we measure the impact on user experience and surveyor productivity?"

---

## Usage Instructions

1. **Start with sections 1-3** to understand the current state
2. **Focus on sections 4-6** for technical implementation details
3. **Use sections 7-9** for quality and testing considerations
4. **Apply sections 10-12** for planning and improvements
5. **Use sections 13-15** for project management and success measurement

## Expected Outcomes

After completing these prompts, you should have:
- Complete understanding of current architecture
- Clear identification of gaps and improvements
- Detailed implementation plan for surveyor filtering
- Risk assessment and mitigation strategies
- Success metrics and monitoring plan

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Prepared for**: Mobile Development Team  
**Project**: Valuations Mobile Tablet App - Comprehensive Analysis



