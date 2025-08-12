import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { QueueEntry } from "../entities/queue-entry.entity";
import { Patient } from "../entities/patient.entity";
import { CreateQueueEntryDto, UpdateQueueEntryDto, QueueQueryDto } from "./dto";

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly queueRepository: Repository<QueueEntry>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async addToQueue(
    createQueueEntryDto: CreateQueueEntryDto,
  ): Promise<QueueEntry> {
    try {
      // Verify patient exists
      const patient = await this.patientRepository.findOne({
        where: { id: createQueueEntryDto.patientId },
      });

      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${createQueueEntryDto.patientId} not found`,
        );
      }

      // Check if patient is already in queue
      const existingEntry = await this.queueRepository.findOne({
        where: {
          patientId: createQueueEntryDto.patientId,
          status: "waiting",
        },
      });

      if (existingEntry) {
        throw new ConflictException("Patient is already in the queue");
      }

      // Generate next queue number
      const queueNumber = await this.generateNextQueueNumber();

      // Create queue entry
      const queueEntry = this.queueRepository.create({
        ...createQueueEntryDto,
        queueNumber,
        arrivalTime: new Date(),
      });

      const savedEntry = await this.queueRepository.save(queueEntry);

      // Calculate and update estimated wait time
      await this.updateEstimatedWaitTimes();

      // Return the entry with patient information
      return await this.findOne(savedEntry.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException("Failed to add patient to queue");
    }
  }

  async findAll(query?: QueueQueryDto): Promise<{
    entries: QueueEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryBuilder = this.queueRepository
      .createQueryBuilder("queue")
      .leftJoinAndSelect("queue.patient", "patient");

    if (query?.status) {
      queryBuilder.andWhere("queue.status = :status", { status: query.status });
    }

    if (query?.priority) {
      queryBuilder.andWhere("queue.priority = :priority", {
        priority: query.priority,
      });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        "(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    if (query?.patientName) {
      queryBuilder.andWhere("patient.name LIKE :patientName", {
        patientName: `%${query.patientName}%`,
      });
    }

    // Ordering
    queryBuilder
      .orderBy("queue.priority", "DESC")
      .addOrderBy("queue.queueNumber", "ASC");

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;
    const offset = (page - 1) * limit;

    // Count total BEFORE applying pagination (query builder state unchanged yet)
    const total = await queryBuilder.getCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const entries = await queryBuilder.skip(offset).take(limit).getMany();
    return { entries, total, page, limit, totalPages };
  }

  async findOne(id: number): Promise<QueueEntry> {
    const queueEntry = await this.queueRepository.findOne({
      where: { id },
      relations: ["patient"],
    });

    if (!queueEntry) {
      throw new NotFoundException(`Queue entry with ID ${id} not found`);
    }

    return queueEntry;
  }

  async findByQueueNumber(queueNumber: number): Promise<QueueEntry> {
    const queueEntry = await this.queueRepository.findOne({
      where: { queueNumber },
      relations: ["patient"],
    });

    if (!queueEntry) {
      throw new NotFoundException(
        `Queue entry with number ${queueNumber} not found`,
      );
    }

    return queueEntry;
  }

  async updateStatus(
    id: number,
    updateQueueEntryDto: UpdateQueueEntryDto,
  ): Promise<QueueEntry> {
    const queueEntry = await this.findOne(id);

    // Handle priority changes - reorder queue if priority changes
    if (
      updateQueueEntryDto.priority &&
      updateQueueEntryDto.priority !== queueEntry.priority
    ) {
      await this.handlePriorityChange(queueEntry, updateQueueEntryDto.priority);
    }

    Object.assign(queueEntry, updateQueueEntryDto);

    try {
      const updatedEntry = await this.queueRepository.save(queueEntry);

      // Recalculate wait times after status change
      await this.updateEstimatedWaitTimes();

      return await this.findOne(updatedEntry.id);
    } catch {
      throw new BadRequestException("Failed to update queue entry");
    }
  }

  async removeFromQueue(id: number): Promise<void> {
    const queueEntry = await this.findOne(id);
    await this.queueRepository.remove(queueEntry);

    // Recalculate wait times after removal
    await this.updateEstimatedWaitTimes();
  }

  async getQueueStats(): Promise<{
    totalWaiting: number;
    totalWithDoctor: number;
    totalCompleted: number;
    urgentWaiting: number;
    averageWaitTime: number;
  }> {
    const [totalWaiting, totalWithDoctor, totalCompleted, urgentWaiting] =
      await Promise.all([
        this.queueRepository.count({ where: { status: "waiting" } }),
        this.queueRepository.count({ where: { status: "with_doctor" } }),
        this.queueRepository.count({ where: { status: "completed" } }),
        this.queueRepository.count({
          where: { status: "waiting", priority: "urgent" },
        }),
      ]);

    // Calculate average wait time for completed entries today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = await this.queueRepository
      .createQueryBuilder("queue")
      .where("queue.status = :status", { status: "completed" })
      .andWhere("queue.arrivalTime >= :today", { today })
      .getMany();

    let averageWaitTime = 0;
    if (completedToday.length > 0) {
      const totalWaitTime = completedToday.reduce((sum, entry) => {
        const waitTime =
          (entry.updatedAt.getTime() - entry.arrivalTime.getTime()) /
          (1000 * 60); // minutes
        return sum + waitTime;
      }, 0);
      averageWaitTime = Math.round(totalWaitTime / completedToday.length);
    }

    return {
      totalWaiting,
      totalWithDoctor,
      totalCompleted,
      urgentWaiting,
      averageWaitTime,
    };
  }

  async getCurrentQueue(): Promise<QueueEntry[]> {
    return await this.queueRepository.find({
      where: { status: "waiting" },
      relations: ["patient"],
      order: {
        priority: "DESC", // Urgent first
        queueNumber: "ASC", // Then by queue number
      },
    });
  }

  private async generateNextQueueNumber(): Promise<number> {
    // Get the highest queue number for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastEntry = await this.queueRepository
      .createQueryBuilder("queue")
      .where("queue.arrivalTime >= :today", { today })
      .orderBy("queue.queueNumber", "DESC")
      .getOne();

    return lastEntry ? lastEntry.queueNumber + 1 : 1;
  }

  private async handlePriorityChange(
    queueEntry: QueueEntry,
    newPriority: "normal" | "urgent",
  ): Promise<void> {
    if (newPriority === "urgent" && queueEntry.priority === "normal") {
      // Moving to urgent - need to reorder
      const urgentEntries = await this.queueRepository.count({
        where: { status: "waiting", priority: "urgent" },
      });

      // Update queue number to be after all urgent entries
      const newQueueNumber = urgentEntries + 1;
      queueEntry.queueNumber = newQueueNumber;
    } else if (newPriority === "normal" && queueEntry.priority === "urgent") {
      // Moving from urgent to normal - assign new queue number at end
      const lastNormalEntry = await this.queueRepository
        .createQueryBuilder("queue")
        .where("queue.status = :status", { status: "waiting" })
        .andWhere("queue.priority = :priority", { priority: "normal" })
        .orderBy("queue.queueNumber", "DESC")
        .getOne();

      queueEntry.queueNumber = lastNormalEntry
        ? lastNormalEntry.queueNumber + 1
        : await this.generateNextQueueNumber();
    }
  }

  private async updateEstimatedWaitTimes(): Promise<void> {
    const waitingEntries = await this.queueRepository.find({
      where: { status: "waiting" },
      order: {
        priority: "DESC",
        queueNumber: "ASC",
      },
    });

    const averageConsultationTime = 15; // minutes per patient
    let cumulativeWaitTime = 0;

    for (const entry of waitingEntries) {
      entry.estimatedWaitTime = cumulativeWaitTime;
      cumulativeWaitTime += averageConsultationTime;

      // Add extra time for urgent cases
      if (entry.priority === "urgent") {
        cumulativeWaitTime += 5; // Extra 5 minutes for urgent cases
      }
    }

    await this.queueRepository.save(waitingEntries);
  }

  async searchQueue(searchTerm: string): Promise<QueueEntry[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const queryBuilder = this.queueRepository
      .createQueryBuilder("queue")
      .leftJoinAndSelect("queue.patient", "patient")
      .where(
        "(patient.name LIKE :search OR patient.contactInfo LIKE :search OR patient.medicalRecordNumber LIKE :search)",
        { search: `%${searchTerm.trim()}%` },
      );

    return await queryBuilder
      .orderBy("queue.priority", "DESC")
      .addOrderBy("queue.queueNumber", "ASC")
      .limit(50)
      .getMany();
  }
}
