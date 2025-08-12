Method | Path | Backend Handler | Returns Envelope? | Frontend Caller(s) | Status
-------|------|-----------------|-------------------|--------------------|-------
GET | /health | AppController.getHealth | Yes | (none direct) | OK
POST | /auth/login | AuthController.login | Yes | AuthContext.login | OK
POST | /auth/logout | AuthController.logout | Yes | AuthContext.logout | OK
GET | /auth/profile | AuthController.getProfile | Yes | (none direct) | OK
GET | /auth/verify | AuthController.verifyToken | Yes | AuthContext init | OK
POST | /auth/refresh | AuthController.refresh | Yes | AuthContext.refreshToken | OK
GET | /dashboard/stats | DashboardController.getDashboardStats | Yes | dashboard.service.ts | OK
POST | /doctors | DoctorsController.create | Yes | appointments.service.ts createDoctor | OK
GET | /doctors | DoctorsController.findAll | Yes | fetch/search/filter doctors | OK
GET | /doctors/available | DoctorsController.findAvailable | Yes | fetchAvailableDoctors | OK
GET | /doctors/specialization/:specialization | DoctorsController.findBySpecialization | Yes | (none) | OK
GET | /doctors/location/:location | DoctorsController.findByLocation | Yes | (none) | OK
GET | /doctors/:id | DoctorsController.findOne | Yes | fetchDoctorById | OK
GET | /doctors/:id/availability | DoctorsController.getAvailability | Yes | fetchDoctorAvailability | OK
PATCH | /doctors/:id | DoctorsController.update | Yes | updateDoctor | OK
PATCH | /doctors/:id/status | DoctorsController.updateStatus | Yes | (none) | OK
PATCH | /doctors/:id/schedule | DoctorsController.updateSchedule | Yes | updateDoctorSchedule | OK
DELETE | /doctors/:id | DoctorsController.remove | 204 No Body | deleteDoctor | OK
POST | /patients | PatientsController.create | Yes | queue/page new patient | OK
GET | /patients | PatientsController.findAll | Yes | fetchPatients (appointments & queue) | OK
GET | /patients/search | PatientsController.search | Yes | searchPatients | OK
GET | /patients/medical-record/:mrn | PatientsController.findByMedicalRecordNumber | Yes | (none) | OK
GET | /patients/validate-medical-record/:mrn | PatientsController.validateMedicalRecordNumber | Yes | (none) | OK
GET | /patients/:id | PatientsController.findOne | Yes | (none) | OK
PATCH | /patients/:id | PatientsController.update | Yes | (none) | OK
DELETE | /patients/:id | PatientsController.remove | 204 No Body | (none) | OK
POST | /appointments | AppointmentsController.create | Yes | createAppointment | OK
GET | /appointments | AppointmentsController.findAll | Yes | fetch/searchAppointments* | OK
GET | /appointments/available-slots | AppointmentsController.getAvailableSlots | Yes | fetchAvailableSlots | OK
GET | /appointments/:id | AppointmentsController.findOne | Yes | fetchAppointmentById | OK
GET | /appointments/statistics/status | AppointmentsController.getStatusStatistics | Yes | fetchAppointmentStats | OK
GET | /appointments/today | AppointmentsController.getTodaysAppointments | Yes | fetchTodaysAppointments | OK
GET | /appointments/upcoming | AppointmentsController.getUpcomingAppointments | Yes | fetchUpcomingAppointments | OK
PATCH | /appointments/:id | AppointmentsController.update | Yes | updateAppointment/cancelAppointment | OK
DELETE | /appointments/:id | AppointmentsController.remove | 204 No Body | deleteAppointment | OK
POST | /queue | QueueController.addToQueue | Yes | addToQueue | OK
GET | /queue | QueueController.findAll | Yes | fetchQueueEntries/searchQueue | OK
GET | /queue/current | QueueController.getCurrentQueue | Yes | fetchCurrentQueue | OK
GET | /queue/stats | QueueController.getQueueStats | Yes | fetchQueueStats | OK
GET | /queue/search | QueueController.searchQueue | Yes | searchQueue | OK
GET | /queue/number/:queueNumber | QueueController.findByQueueNumber | Yes | (none) | OK
GET | /queue/:id | QueueController.findOne | Yes | (none) | OK
PATCH | /queue/:id | QueueController.updateStatus | Yes | updateQueueEntryStatus | OK
DELETE | /queue/:id | QueueController.removeFromQueue | 204 No Body | removeFromQueue | OK
GET | /monitoring/health | MonitoringController.getHealth | Yes | (none) | OK
GET | /monitoring/ready | MonitoringController.getReady | Yes | (none) | OK
GET | /monitoring/errors | MonitoringController.getErrorStats | Yes | (none) | OK
GET | /monitoring/errors/recent | MonitoringController.getRecentErrors | Yes | (none) | OK
GET | /monitoring/cache | MonitoringController.getCacheStats | Yes | (none) | OK
GET | /monitoring/test-error | MonitoringController.testError | Throws Error | (none) | OK
