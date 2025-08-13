# Page snapshot

```yaml
- img
- heading "Front Desk System" [level=1]
- paragraph: Welcome to the Clinic Front Desk Management System
- text: Username
- textbox "Username" [disabled]: admin
- text: Password*
- textbox "Password*" [disabled]: admin123
- button "Signing in..." [disabled]
- button "Need an account? Sign up here" [disabled]
- img
- paragraph: "Default credentials:"
- paragraph: "Staff: staff / Staff123"
- navigation "Mobile navigation":
  - link "Dashboard":
    - /url: /dashboard
    - img
    - text: Dashboard
  - link "Queue":
    - /url: /dashboard/queue
    - img
    - text: Queue
  - link "Appointments":
    - /url: /dashboard/appointments
    - img
    - text: Appointments
  - link "Doctors":
    - /url: /dashboard/doctors
    - img
    - text: Doctors
- alert
- region "Notifications"
- img
- heading "Performance Dashboard" [level=3]
- button "Disable"
- text: ▼
```