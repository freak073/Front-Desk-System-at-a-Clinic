import { ApiTags } from '@nestjs/swagger';
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
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueEntryDto, UpdateQueueEntryDto, QueueEntryResponseDto, QueueQueryDto } from './dto';
import { plainToClass } from 'class-transformer';

@ApiTags('Queue')
@Controller('queue')
@UseInterceptors(ClassSerializerInterceptor)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async addToQueue(@Body() createQueueEntryDto: CreateQueueEntryDto): Promise<QueueEntryResponseDto> {
    const queueEntry = await this.queueService.addToQueue(createQueueEntryDto);
  return { success: true, data: plainToClass(QueueEntryResponseDto, queueEntry) } as any;
  }

  @Get()
  async findAll(@Query() query: QueueQueryDto): Promise<{ success: true; data: QueueEntryResponseDto[]; meta: any; }> {
    const result = await this.queueService.findAll(query);
    return {
      success: true,
      data: result.entries.map(entry => plainToClass(QueueEntryResponseDto, entry)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('current')
  async getCurrentQueue(): Promise<any> {
    const queueEntries = await this.queueService.getCurrentQueue();
    return {
      success: true,
      data: queueEntries.map(entry => plainToClass(QueueEntryResponseDto, entry)),
      meta: { total: queueEntries.length },
    };
  }

  @Get('stats')
  async getQueueStats() {
    const stats = await this.queueService.getQueueStats();
    return { success: true, data: stats };
  }

  @Get('search')
  async searchQueue(@Query('q') searchTerm: string): Promise<any> {
    const queueEntries = await this.queueService.searchQueue(searchTerm);
    return { success: true, data: queueEntries.map(entry => plainToClass(QueueEntryResponseDto, entry)), meta: { total: queueEntries.length } };
  }

  @Get('number/:queueNumber')
  async findByQueueNumber(
    @Param('queueNumber', ParseIntPipe) queueNumber: number,
  ): Promise<any> {
    const queueEntry = await this.queueService.findByQueueNumber(queueNumber);
    return { success: true, data: plainToClass(QueueEntryResponseDto, queueEntry) };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const queueEntry = await this.queueService.findOne(id);
    return { success: true, data: plainToClass(QueueEntryResponseDto, queueEntry) };
  }

  @Patch(':id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQueueEntryDto: UpdateQueueEntryDto,
  ): Promise<any> {
    const queueEntry = await this.queueService.updateStatus(id, updateQueueEntryDto);
    return { success: true, data: plainToClass(QueueEntryResponseDto, queueEntry) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromQueue(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.queueService.removeFromQueue(id);
  }
}