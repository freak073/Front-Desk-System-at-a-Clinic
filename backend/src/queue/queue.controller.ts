import { ApiTags } from "@nestjs/swagger";
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { QueueService } from "./queue.service";
import {
  CreateQueueEntryDto,
  UpdateQueueEntryDto,
  QueueEntryResponseDto,
  QueueQueryDto,
} from "./dto";
import { plainToClass } from "class-transformer";
import {
  ApiResponseDto,
  PaginatedResponseDto,
} from "../common/dto/api-response.dto";

@ApiTags("Queue")
@Controller("queue")
@UseInterceptors(ClassSerializerInterceptor)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async addToQueue(
    @Body() createQueueEntryDto: CreateQueueEntryDto,
  ): Promise<ApiResponseDto<QueueEntryResponseDto>> {
    const queueEntry = await this.queueService.addToQueue(createQueueEntryDto);
    return ApiResponseDto.success(
      plainToClass(QueueEntryResponseDto, queueEntry),
    );
  }

  @Get()
  async findAll(
    @Query() query: QueueQueryDto,
  ): Promise<PaginatedResponseDto<QueueEntryResponseDto>> {
    const result = await this.queueService.findAll(query);
    return new PaginatedResponseDto(
      result.entries.map((e) => plainToClass(QueueEntryResponseDto, e)),
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    );
  }

  @Get("current")
  async getCurrentQueue(): Promise<
    PaginatedResponseDto<QueueEntryResponseDto>
  > {
    const queueEntries = await this.queueService.getCurrentQueue();
    return new PaginatedResponseDto(
      queueEntries.map((e) => plainToClass(QueueEntryResponseDto, e)),
      {
        page: 1,
        limit: queueEntries.length || 0,
        total: queueEntries.length,
        totalPages: 1,
      },
    );
  }

  @Get("stats")
  async getQueueStats(): Promise<ApiResponseDto<unknown>> {
    const stats = await this.queueService.getQueueStats();
    return ApiResponseDto.success(stats);
  }

  @Get("search")
  async searchQueue(
    @Query("q") searchTerm: string,
  ): Promise<PaginatedResponseDto<QueueEntryResponseDto>> {
    const queueEntries = await this.queueService.searchQueue(searchTerm);
    return new PaginatedResponseDto(
      queueEntries.map((e) => plainToClass(QueueEntryResponseDto, e)),
      {
        page: 1,
        limit: queueEntries.length || 0,
        total: queueEntries.length,
        totalPages: 1,
      },
    );
  }

  @Get("number/:queueNumber")
  async findByQueueNumber(
    @Param("queueNumber", ParseIntPipe) queueNumber: number,
  ): Promise<ApiResponseDto<QueueEntryResponseDto>> {
    const queueEntry = await this.queueService.findByQueueNumber(queueNumber);
    return ApiResponseDto.success(
      plainToClass(QueueEntryResponseDto, queueEntry),
    );
  }

  @Get(":id")
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ApiResponseDto<QueueEntryResponseDto>> {
    const queueEntry = await this.queueService.findOne(id);
    return ApiResponseDto.success(
      plainToClass(QueueEntryResponseDto, queueEntry),
    );
  }

  @Patch(":id")
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateQueueEntryDto: UpdateQueueEntryDto,
  ): Promise<ApiResponseDto<QueueEntryResponseDto>> {
    const queueEntry = await this.queueService.updateStatus(
      id,
      updateQueueEntryDto,
    );
    return ApiResponseDto.success(
      plainToClass(QueueEntryResponseDto, queueEntry),
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromQueue(@Param("id", ParseIntPipe) id: number): Promise<void> {
    await this.queueService.removeFromQueue(id);
  }
}
