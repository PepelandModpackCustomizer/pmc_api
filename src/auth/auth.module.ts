import {Module} from "@nestjs/common";
import {AuthController} from "./auth.controller";
import {AuthService} from "./auth.service";
import {DatabaseService} from "../database/db.service";

@Module({
    providers: [AuthService, DatabaseService],
    controllers: [AuthController]
})
export class AuthModule {}
