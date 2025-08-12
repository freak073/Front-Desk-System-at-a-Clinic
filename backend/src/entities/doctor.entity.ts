import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("doctors")
@Index(["specialization"])
@Index(["status"])
@Index(["name"])
@Index(["specialization", "status"])
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  specialization: string;

  @Column({
    type: process.env.NODE_ENV === "test" ? "varchar" : "enum",
    enum:
      process.env.NODE_ENV === "test" ? undefined : ["male", "female", "other"],
    length: process.env.NODE_ENV === "test" ? 10 : undefined,
  })
  gender: string;

  @Column({ length: 100 })
  location: string;

  @Column({
    type: process.env.NODE_ENV === "test" ? "text" : "json",
    name: "availability_schedule",
    nullable: true,
  })
  availabilitySchedule: object;

  @Column({
    type: process.env.NODE_ENV === "test" ? "varchar" : "enum",
    enum:
      process.env.NODE_ENV === "test"
        ? undefined
        : ["available", "busy", "off_duty"],
    length: process.env.NODE_ENV === "test" ? 20 : undefined,
    default: "available",
  })
  status: string;

  // Appointments relationship will be added when Appointment entity is properly implemented
  // @OneToMany('Appointment', 'doctor')
  // appointments: any[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
