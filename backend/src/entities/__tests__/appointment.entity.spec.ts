import { Appointment } from "../appointment.entity";

describe("Appointment Entity", () => {
  let appointment: Appointment;

  beforeEach(() => {
    appointment = new Appointment();
  });

  it("should be defined", () => {
    expect(appointment).toBeDefined();
  });

  it("should have correct properties", () => {
    const patient = { id: 1, name: "John Smith" };
    const doctor = { id: 1, name: "Dr. Jane Doe" };
    const appointmentDate = new Date("2024-01-15 10:00:00");

    appointment.id = 1;
    appointment.patientId = 1;
    appointment.doctorId = 1;
    appointment.appointmentDatetime = appointmentDate;
    appointment.status = "booked";
    appointment.notes = "Regular checkup";
    appointment.patient = patient;
    appointment.doctor = doctor;
    appointment.createdAt = new Date();
    appointment.updatedAt = new Date();

    expect(appointment.id).toBe(1);
    expect(appointment.patientId).toBe(1);
    expect(appointment.doctorId).toBe(1);
    expect(appointment.appointmentDatetime).toBe(appointmentDate);
    expect(appointment.status).toBe("booked");
    expect(appointment.notes).toBe("Regular checkup");
    expect(appointment.patient).toBe(patient);
    expect(appointment.doctor).toBe(doctor);
    expect(appointment.createdAt).toBeInstanceOf(Date);
    expect(appointment.updatedAt).toBeInstanceOf(Date);
  });

  it("should accept valid status values", () => {
    const validStatuses = ["booked", "completed", "canceled"];

    validStatuses.forEach((status) => {
      appointment.status = status;
      expect(appointment.status).toBe(status);
    });
  });

  it("should allow nullable notes", () => {
    appointment.notes = null;
    expect(appointment.notes).toBeNull();
  });

  it("should handle datetime properly", () => {
    const testDate = new Date("2024-12-25 14:30:00");
    appointment.appointmentDatetime = testDate;

    expect(appointment.appointmentDatetime).toBe(testDate);
    expect(appointment.appointmentDatetime.getFullYear()).toBe(2024);
    expect(appointment.appointmentDatetime.getMonth()).toBe(11); // December is month 11
    expect(appointment.appointmentDatetime.getDate()).toBe(25);
    expect(appointment.appointmentDatetime.getHours()).toBe(14);
    expect(appointment.appointmentDatetime.getMinutes()).toBe(30);
  });
});
