import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as request from "supertest";
import { DoctorsModule } from "./doctors.module";
import { Doctor } from "../entities/doctor.entity";

// Test helper types
interface ApiEnvelope<T, M = any> {
  success: boolean;
  data: T;
  meta?: M;
  message?: string;
}
interface DoctorDto {
  id: number;
  name: string;
  specialization: string;
  gender: string;
  location: string;
  status: string;
  availabilitySchedule?: Record<string, string> | null;
  createdAt?: string;
  updatedAt?: string;
}

describe("DoctorsController (Integration)", () => {
  let app: INestApplication;
  let doctorId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [Doctor],
          synchronize: true,
        }),
        DoctorsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  }, 10000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("POST /doctors", () => {
    it("should create a new doctor", async () => {
      const createDoctorDto = {
        name: "Dr. John Smith",
        specialization: "Cardiology",
        gender: "male",
        location: "Building A, Room 101",
        availabilitySchedule: { monday: "9:00-17:00" },
        status: "available",
      };

      const response = await request(app.getHttpServer())
        .post("/doctors")
        .send(createDoctorDto)
        .expect(201);
      const body = response.body as ApiEnvelope<DoctorDto>;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        name: createDoctorDto.name,
        specialization: createDoctorDto.specialization,
        gender: createDoctorDto.gender,
        location: createDoctorDto.location,
        status: createDoctorDto.status,
      });
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();

      doctorId = body.data.id;
    });

    it("should return 400 for invalid doctor data", async () => {
      const invalidDoctorDto = {
        name: "",
        specialization: "Cardiology",
        gender: "invalid_gender",
        location: "Building A",
      };

      await request(app.getHttpServer())
        .post("/doctors")
        .send(invalidDoctorDto)
        .expect(400);
    });
  });

  describe("GET /doctors", () => {
    it("should return all doctors", async () => {
      const response = await request(app.getHttpServer())
        .get("/doctors")
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto[], { total: number }>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.meta?.total).toBeGreaterThan(0);
      expect(body.data[0]).toHaveProperty("id");
      expect(body.data[0]).toHaveProperty("name");
      expect(body.data[0]).toHaveProperty("specialization");
    });

    it("should filter doctors by specialization", async () => {
      const response = await request(app.getHttpServer())
        .get("/doctors?specialization=Cardiology")
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto[]>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((doctor) => {
        expect(doctor.specialization).toBe("Cardiology");
      });
    });

    it("should filter doctors by status", async () => {
      const response = await request(app.getHttpServer())
        .get("/doctors?status=available")
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto[]>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((doctor) => {
        expect(doctor.status).toBe("available");
      });
    });

    it("should search doctors by name", async () => {
      const response = await request(app.getHttpServer())
        .get("/doctors?search=John")
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto[]>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((doctor) => {
        expect(doctor.name.toLowerCase()).toContain("john");
      });
    });
  });

  describe("GET /doctors/available", () => {
    it("should return only available doctors", async () => {
      const response = await request(app.getHttpServer())
        .get("/doctors/available")
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto[]>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((doctor) => {
        expect(doctor.status).toBe("available");
      });
    });
  });

  describe("GET /doctors/specialization/:specialization", () => {
    it("should return doctors by specialization", async () => {
      const response = await request(app.getHttpServer())
        .get("/doctors/specialization/Cardiology")
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto[]>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((doctor) => {
        expect(doctor.specialization).toBe("Cardiology");
      });
    });
  });

  describe("GET /doctors/location/:location", () => {
    it("should return doctors by location", async () => {
      const response = await request(app.getHttpServer())
        .get("/doctors/location/Building A, Room 101")
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto[]>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach((doctor) => {
        expect(doctor.location).toBe("Building A, Room 101");
      });
    });
  });

  describe("GET /doctors/:id", () => {
    it("should return a doctor by id", async () => {
      const response = await request(app.getHttpServer())
        .get(`/doctors/${doctorId}`)
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto>;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty("id", doctorId);
      expect(body.data).toHaveProperty("name");
      expect(body.data).toHaveProperty("specialization");
    });

    it("should return 404 for non-existent doctor", async () => {
      await request(app.getHttpServer()).get("/doctors/999").expect(404);
    });
  });

  describe("GET /doctors/:id/availability", () => {
    it("should return doctor availability information", async () => {
      const response = await request(app.getHttpServer())
        .get(`/doctors/${doctorId}/availability`)
        .expect(200);
      const body = response.body as ApiEnvelope<{
        doctor: DoctorDto;
        nextAvailableTime: string | null;
      }>;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty("doctor");
      expect(body.data).toHaveProperty("nextAvailableTime");
      expect(body.data.doctor).toHaveProperty("id", doctorId);
      expect(body.data.doctor).toHaveProperty("status");
    });

    it("should return 404 for non-existent doctor availability", async () => {
      await request(app.getHttpServer())
        .get("/doctors/999/availability")
        .expect(404);
    });
  });

  describe("PATCH /doctors/:id", () => {
    it("should update a doctor", async () => {
      const updateDoctorDto = {
        name: "Dr. John Updated",
        specialization: "Neurology",
      };

      const response = await request(app.getHttpServer())
        .patch(`/doctors/${doctorId}`)
        .send(updateDoctorDto)
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto>;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: doctorId,
        name: updateDoctorDto.name,
        specialization: updateDoctorDto.specialization,
      });
    });

    it("should return 404 for non-existent doctor", async () => {
      const updateDoctorDto = {
        name: "Dr. John Updated",
      };

      await request(app.getHttpServer())
        .patch("/doctors/999")
        .send(updateDoctorDto)
        .expect(404);
    });
  });

  describe("PATCH /doctors/:id/status", () => {
    it("should update doctor status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/doctors/${doctorId}/status`)
        .send({ status: "busy" })
        .expect(200);
      const body = response.body as ApiEnvelope<DoctorDto>;
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: doctorId,
        status: "busy",
      });
    });

    it("should return 404 for non-existent doctor", async () => {
      await request(app.getHttpServer())
        .patch("/doctors/999/status")
        .send({ status: "busy" })
        .expect(404);
    });
  });

  describe("DELETE /doctors/:id", () => {
    it("should delete a doctor", async () => {
      await request(app.getHttpServer())
        .delete(`/doctors/${doctorId}`)
        .expect(204);

      // Verify doctor is deleted
      await request(app.getHttpServer())
        .get(`/doctors/${doctorId}`)
        .expect(404);
    });

    it("should return 404 for non-existent doctor", async () => {
      await request(app.getHttpServer()).delete("/doctors/999").expect(404);
    });
  });
});
