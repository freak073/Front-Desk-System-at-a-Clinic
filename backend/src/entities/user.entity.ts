import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ name: "password_hash", length: 255 })
  passwordHash: string;

  @Column({
    type: "enum",
    enum: ["admin", "staff"],
    default: "staff",
  })
  role: string;

  @Column({ name: "full_name", length: 100, nullable: true })
  fullName?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
