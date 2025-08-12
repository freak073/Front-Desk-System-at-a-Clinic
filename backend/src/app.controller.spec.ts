import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("getHealth", () => {
    it("should return health status", () => {
      const result = appController.getHealth();
      expect(result.success).toBe(true);
      expect(result.message).toBe("Front Desk System API is running");
      expect(result.timestamp).toBeDefined();
    });
  });
});
