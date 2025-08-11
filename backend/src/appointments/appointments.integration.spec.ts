import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../app.module";
import { Appointment } from "../entities/appointment.entity";
import { Doctor } from "../entities/doctor.entity";
import { Patient } from "../entities/patient.entity";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";

// Helper to generate a valid appointment datetime (future weekday)
function getValidFutureWeekdayISODate(daysAhead = 1) {
  let date = new Date();
  date.setDate(date.getDate() + daysAhead);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

describe("AppointmentsController (Integration)", () => {
  let app: INestApplication;
  let appointmentRepository: Repository<Appointment>;
  let doctorRepository: Repository<Doctor>;
  let patientRepository: Repository<Patient>;
  let userRepository: Repository<User>;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    appointmentRepository = moduleFixture.get<Repository<Appointment>>(
      getRepositoryToken(Appointment),
    );
    doctorRepository = moduleFixture.get<Repository<Doctor>>(
      getRepositoryToken(Doctor),
    );
    patientRepository = moduleFixture.get<Repository<Patient>>(
      getRepositoryToken(Patient),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await appointmentRepository.query("SET FOREIGN_KEY_CHECKS = 0");
    await appointmentRepository.clear();
    await patientRepository.clear();
    await doctorRepository.clear();
    await userRepository.clear();
    await appointmentRepository.query("SET FOREIGN_KEY_CHECKS = 1");

    const hashedPassword = await bcrypt.hash("password123", 10);
    const testUser = userRepository.create({
      username: "testuser",
      passwordHash: hashedPassword,
      role: "front_desk",
    });
    await userRepository.save(testUser);

    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ username: "testuser", password: "password123" })
      .expect(200);

    authToken = loginResponse.body.access_token;
  });

  describe("POST /appointments", () => {
    it("should create a new appointment", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      const appointmentData = {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDatetime: getValidFutureWeekdayISODate(),
        notes: "Regular checkup",
      };

      const response = await request(app.getHttpServer())
        .post("/appointments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.patientId).toBe(patient.id);
      expect(response.body.data.doctorId).toBe(doctor.id);
      expect(response.body.data.status).toBe("booked");
    });

    it("should return 404 if patient does not exist", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const appointmentData = {
        patientId: 999, // Non-existent patient
        doctorId: doctor.id,
        appointmentDatetime: getValidFutureWeekdayISODate(),
      };

      const response = await request(app.getHttpServer())
        .post("/appointments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(404);

      expect(response.body.message).toContain("Patient with ID 999 not found");
    });

    it("should return 400 if appointment time is in the past", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      // Generate a valid weekday, but in the past
      let pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      while (pastDate.getDay() === 0 || pastDate.getDay() === 6) {
        pastDate.setDate(pastDate.getDate() - 1);
      }
      pastDate.setHours(10, 0, 0, 0);

      const appointmentData = {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDatetime: pastDate.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post("/appointments")
        .set("Authorization", `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(400);

      expect(response.body.message).toContain("Appointment time must be in the future");
    });
  });

  describe("GET /appointments", () => {
    it("should return paginated appointments", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      const appointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: new Date(getValidFutureWeekdayISODate()),
          status: "booked",
        }),
      );

      const response = await request(app.getHttpServer())
        .get("/appointments")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
  expect(response.body.meta).toHaveProperty("total");
  expect(response.body.meta).toHaveProperty("totalPages");
    });

    it("should filter appointments by status", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      const bookedAppointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: new Date(getValidFutureWeekdayISODate()),
          status: "booked",
        }),
      );

      let completedDate = new Date(getValidFutureWeekdayISODate());
      completedDate.setDate(completedDate.getDate() + 1);

      const completedAppointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: completedDate,
          status: "completed",
        }),
      );

      const response = await request(app.getHttpServer())
        .get("/appointments?status=booked")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe("booked");
    });
  });

  describe("GET /appointments/:id", () => {
    it("should return a specific appointment", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      const appointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: new Date(getValidFutureWeekdayISODate()),
          status: "booked",
        }),
      );

      const response = await request(app.getHttpServer())
        .get(`/appointments/${appointment.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(appointment.id);
      expect(response.body.data.patient).toBeDefined();
      expect(response.body.data.doctor).toBeDefined();
    });

    it("should return 404 for non-existent appointment", async () => {
      const response = await request(app.getHttpServer())
        .get("/appointments/999")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain("Appointment with ID 999 not found");
    });
  });

  describe("PATCH /appointments/:id", () => {
    it("should update an appointment", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      const appointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: new Date(getValidFutureWeekdayISODate()),
          status: "booked",
        }),
      );

      const updateData = {
        status: "completed",
        notes: "Appointment completed successfully",
      };

      const response = await request(app.getHttpServer())
        .patch(`/appointments/${appointment.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("completed");
      expect(response.body.data.notes).toBe("Appointment completed successfully");
    });
  });

  describe("DELETE /appointments/:id", () => {
    it("should delete an appointment", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      const appointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: new Date(getValidFutureWeekdayISODate()),
          status: "booked",
        }),
      );

      await request(app.getHttpServer())
        .delete(`/appointments/${appointment.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      const deletedAppointment = await appointmentRepository.findOne({
        where: { id: appointment.id },
      });
      expect(deletedAppointment).toBeNull();
    });
  });

  describe("GET /appointments/available-slots", () => {
    it("should return available time slots for a doctor", async () => {
      const doctor = doctorRepository.create({
        name: "Dr. Smith",
        specialization: "Cardiology",
        gender: "male",
        location: "Room 101",
        status: "available",
      });
      await doctorRepository.save(doctor);

      // Fetch the doctor from DB to ensure id is set
      const savedDoctor = await doctorRepository.findOne({ where: { name: "Dr. Smith" } });
      expect(savedDoctor).toBeDefined();
      expect(typeof savedDoctor.id).toBe('number');

      // Generate a valid ISO date string for a future weekday (YYYY-MM-DD)
      let date = new Date();
      date.setDate(date.getDate() + 1);
      while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
      }
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      const response = await request(app.getHttpServer())
        .get('/appointments/available-slots')
        .query({
          doctorId: savedDoctor.id,
          date: dateStr,
        })
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status !== 200) {
        // Print the error response for debugging
        // eslint-disable-next-line no-console
        console.log('Available slots error response:', response.body);
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("GET /appointments/statistics/status", () => {
    it("should return appointment status statistics", async () => {
      const doctor = await doctorRepository.save(
        doctorRepository.create({
          name: "Dr. Smith",
          specialization: "Cardiology",
          gender: "male",
          location: "Room 101",
          status: "available",
        }),
      );

      const patient = await patientRepository.save(
        patientRepository.create({
          name: "John Doe",
          contactInfo: "john@example.com",
        }),
      );

      const bookedAppointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: new Date(getValidFutureWeekdayISODate()),
          status: "booked",
        }),
      );

      let completedDate2 = new Date(getValidFutureWeekdayISODate());
      completedDate2.setDate(completedDate2.getDate() + 1);

      const completedAppointment = await appointmentRepository.save(
        appointmentRepository.create({
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDatetime: completedDate2,
          status: "completed",
        }),
      );

      const response = await request(app.getHttpServer())
        .get("/appointments/statistics/status")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty("status");
      expect(response.body.data[0]).toHaveProperty("count");
    });
  });

  describe("Authentication", () => {
    it("should return 401 without auth token", async () => {
      await request(app.getHttpServer()).get("/appointments").expect(401);
    });

    it("should return 401 with invalid auth token", async () => {
      await request(app.getHttpServer())
        .get("/appointments")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });
});
