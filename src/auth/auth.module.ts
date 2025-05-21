import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { DatabaseService } from "../database/db.service";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [JwtModule.register({secret: process.env.JWT_SECRET})],
    providers: [AuthService, DatabaseService],
    controllers: [AuthController]
})
export class AuthModule {}
