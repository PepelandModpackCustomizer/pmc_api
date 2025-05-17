import {Module} from "@nestjs/common";
import {AuthController} from "./auth.controller.js";
import {AuthService} from "./auth.service.js";
import {DatabaseService} from "../database/db.service.js";

@Module({
    providers: [AuthService, DatabaseService],
    controllers: [AuthController]
})
export class AuthModule {}
