import { ApiTags } from "@nestjs/swagger";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Dashboard")
@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  async getDashboardStats() {
    const stats = await this.dashboardService.getDashboardStats();
    return {
      success: true,
      data: stats,
    };
  }
}
