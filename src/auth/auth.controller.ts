import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Query,
    Req,
    Res
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";

@Controller("/auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get("/discord/")
    async loginDiscord(
        @Req() req: Request,
        @Res() res: Response,
        @Query("code") code: string
    ) {
        const headerUserAgent = req.headers["user-agent"];
        if (!headerUserAgent) {
            throw new HttpException(
                "User-Agent header is required for this endpoint",
                HttpStatus.BAD_REQUEST
            );
        }
        if (!code) {
            throw new HttpException("Invalid code", HttpStatus.BAD_REQUEST);
        }
        const [accessToken, refreshToken] = await this.authService.loginDiscord(
            code,
            headerUserAgent
        );
        return res
            .cookie("access_token", accessToken, { maxAge: 60*20 })
            .cookie("refresh_token", refreshToken, { maxAge: 60*60*24*2 })
            .json({ access_token: accessToken, refresh_token: refreshToken })
        ;
    }
}
