import {Controller, Get, HttpException, HttpStatus, Req, Res} from "@nestjs/common";
import {Request, Response} from "express";
import { AuthService } from "./auth.service";

@Controller('/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get('/discord')
    async loginDiscord(@Req() req: Request, @Res() res: Response) {
        const headerUserAgent = req.headers["user-agent"]
        if (!headerUserAgent) {
            throw new HttpException("User-Agent header is required for this endpoint", HttpStatus.BAD_REQUEST)
        }
    }
}
