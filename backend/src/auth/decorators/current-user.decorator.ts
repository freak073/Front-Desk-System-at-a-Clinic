import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "../../entities/user.entity";

interface RequestWithUser extends Request {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user; // assertion safe: guard ensures presence
  },
);
