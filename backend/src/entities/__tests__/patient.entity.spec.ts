import { Patient } from "../patient.entity";

describe("Patient Entity", () => {
  let patient: Patient;

  beforeEach(() => {
    patient = new Patient();
  });

  it("should be defined", () => {
    expect(patient).toBeDefined();
  });

  it("should have correct properties", () => {
    patient.id = 1;
    patient.name = "John Smith";
    patient.contactInfo = "john@email.com, (555) 123-4567";
    patient.medicalRecordNumber = "MR001";
    patient.createdAt = new Date();
    patient.updatedAt = new Date();

    expect(patient.id).toBe(1);
    expect(patient.name).toBe("John Smith");
    expect(patient.contactInfo).toBe("john@email.com, (555) 123-4567");
    expect(patient.medicalRecordNumber).toBe("MR001");
    expect(patient.createdAt).toBeInstanceOf(Date);
    expect(patient.updatedAt).toBeInstanceOf(Date);
  });

  it("should allow nullable contact info and medical record number", () => {
    patient.name = "Jane Doe";
    patient.contactInfo = null;
    patient.medicalRecordNumber = null;

    expect(patient.name).toBe("Jane Doe");
    expect(patient.contactInfo).toBeNull();
    expect(patient.medicalRecordNumber).toBeNull();
  });
});
