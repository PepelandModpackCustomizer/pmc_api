import { Injectable } from "@nestjs/common";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { User, Permissions, UserIntegrations, Session } from "./types";

@Injectable()
export class DatabaseService {
    // <core>
    private async connect(): Promise<NeonQueryFunction<false, false>> {
        if (!process.env.DATABASE_URL)
            throw new Error("Missing database URL in .env");
        return neon(process.env.DATABASE_URL);
    }

    private async doSql(query: string, params?: any) {
        const sql = await this.connect();
        const res = await sql.query(query, params);
        return res;
    }

    private async getRows(
        values: string = "*",
        table: string,
        where: string,
        params?: any[],
        additional_query: string = ""
    ) {
        const res = await this.doSql(
            `SELECT ${values} FROM ${table} WHERE ${where} ${additional_query}`,
            params
        );
        return res;
    }

    private async getSingleRow(
        values: string = "*",
        table: string,
        where: string,
        params?: any[],
        additional_query: string = ""
    ) {
        const [res] = await this.getRows(
            values,
            table,
            where,
            params,
            additional_query
        );
        return res;
    }

    private async insertRow(
        table: string,
        columns: string,
        values: string,
        params?: any[],
        additional_query: string = ""
    ) {
        const [response] = await this.doSql(
            `INSERT INTO ${table} (${columns}) VALUES (${values}) ${additional_query}`,
            params
        );
        if (response) return response;
    }

    private async deleteRow(
        table: string,
        where: string,
        params?: any[],
        additional_query: string = ""
    ) {
        await this.doSql(
            `DELETE FROM ${table} WHERE ${where} ${additional_query}`,
            params
        );
    }

    private async updateRow(
        table: string,
        values: string,
        params?: any[],
        additional_query: string = ""
    ) {
        await this.doSql(
            `UPDATE ${table} VALUES SET ${values} ${additional_query}`,
            params
        );
    }
    // </core>

    // <auth>
    async getUser(user_id: bigint, values: string = "*") {
        const user = await this.getSingleRow(values, "Users", "user_id = $1", [
            user_id
        ]);
        if (!user) return;
        const parsed_user = user as User;
        parsed_user.permissions = new Permissions(user["permissions"] ?? 0);
        return parsed_user;
    }

    async createUser(permissions: Permissions) {
        const convertedPermissions = permissions.getAll();
        const res = await this.insertRow(
            "Users",
            "permissions",
            "$1",
            [convertedPermissions],
            "RETURNING user_id"
        );
        const id = BigInt(res?.["user_id"]);
        return await this.getUser(id);
    }

    async deleteUser(user_id: bigint) {
        await this.deleteRow("Users", "user_id = $1", [user_id]);
    }

    async getUserIntegrations(user_id: bigint, values: string = "*") {
        const integrations = await this.getSingleRow(
            values,
            "UsersIntegrations",
            "user_id = $1",
            [user_id]
        );
        return integrations as UserIntegrations;
    }

    async getUserIntegrationsDiscord(discord_id: bigint, values: string = "*") {
        const integrations = await this.getSingleRow(
            values,
            "UsersIntegrations",
            "discord_id = $1",
            [discord_id]
        );
        if (!integrations) return;
        return integrations as UserIntegrations;
    }

    async setUserIntegration(
        user_id: bigint,
        key: string,
        value: string | number | bigint
    ) {
        if (await this.getUserIntegrations(user_id)) {
            await this.updateRow("UsersIntegrations", `${key} = $1`, [value]);
        } else {
            await this.insertRow(
                "UsersIntegrations",
                `user_id, ${key}`,
                "$1, $2",
                [user_id, value]
            );
        }
    }

    async getSession(jti: string) {
        const res = await this.getSingleRow("*", "Sessions", "jti = $1", [jti])
        return res as Session;
    }

    async createSession(jti: string, user_id: bigint, user_agent: string) {
        await this.insertRow("Sessions", "jti, user_id, user_agent", "$1, $2, $3", [jti, user_id, user_agent])
    }
    // </auth>
}
