import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/db.service";
import DiscordOAuth from "easy-discord-oauth";
import { Permissions, User } from "../database/types";
import {v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

@Injectable()
export class AuthService {
    constructor(private readonly dbService: DatabaseService) {}

    private async generateTokens(payload: object, jti: string, sub: string, expires_in: number, expires_in_refresh: number) {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new HttpException("Internal Server Error", 500);
        const access = jwt.sign({
            ...payload,
            "type": "access"
            },
            secret, {
            jwtid: jti,
            subject: sub,
            expiresIn: expires_in
        })
        const refresh = jwt.sign({
            "type": "refresh"
        }, secret, {
            jwtid: jti,
            subject: sub,
            expiresIn: expires_in_refresh
        })
        return [access, refresh]
    }

    private async createSession(userId: bigint, userAgent: string, scope?: Permissions) {
        const user = await this.dbService.getUser(userId);
        if (!user) throw new HttpException("User does not exist", HttpStatus.NOT_FOUND);

        const tokenScope = scope ?? user.permissions
        if (scope) {
            if (tokenScope.getAll() > user.permissions.getAll()) {
                throw new HttpException("Permission denied", HttpStatus.FORBIDDEN);
            }
            // TODO: Add check of permissions
        }

        let jti: string;
        let exists: boolean;
        do {
            jti = uuidv4();
            const result = await this.dbService.getSession(jti);
            exists = result != undefined
        } while (exists)
        const [accessToken, refreshToken] = await this.generateTokens({}, jti, user.user_id.toString(), 60*20, 60*60*24*2)
        await this.dbService.createSession(jti, userId, userAgent)
        return [accessToken, refreshToken]
    }

    // <discord>
    async loginDiscord(code: string, userAgent: string) {
        const discordRedirectUrl = process.env.DISCORD_REDIRECT_URL;
        const discordClientId = process.env.DISCORD_CLIENT_ID;
        const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
        if (!discordRedirectUrl || !discordClientId || !discordClientSecret)
            throw new HttpException("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
        const discordTokenRes = await DiscordOAuth.exchangeCode(
            code,
            discordRedirectUrl,
            discordClientId,
            discordClientSecret
        );
        const discordToken = discordTokenRes.accessToken;

        const discordUserId = BigInt(
            (await DiscordOAuth.User.getCurrentUser(discordToken)).id
        );
        const integrations =
            await this.dbService.getUserIntegrationsDiscord(discordUserId);
        let userId;
        if (!integrations || !integrations.discord_id) {
            userId = (await this.registerDiscord(discordUserId)).user_id;
        } else {
            userId = integrations.user_id;
        }
        const [accessToken, refreshToken] = await this.createSession(userId, userAgent)
        return [accessToken, refreshToken]
    }

    private async registerDiscord(discordId: bigint): Promise<User> {
        const user = await this.dbService.createUser(Permissions.DEFAULT);
        if (!user) throw new HttpException("Failed to register new user", HttpStatus.INTERNAL_SERVER_ERROR);
        await this.dbService.setUserIntegration(
            user.user_id,
            "discord_id",
            discordId
        );
        return user;
    }
    // </discord>
}
