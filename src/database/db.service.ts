import {Injectable} from "@nestjs/common";
import {neon, NeonQueryFunction} from "@neondatabase/serverless";
import {User, Permissions} from "./types";


@Injectable()
export class DatabaseService {
    // <core>
    async connect(): Promise<NeonQueryFunction<false, false>> {
        if (!process.env.DATABASE_URL) throw new Error("Missing database URL in .env");
        return neon(process.env.DATABASE_URL);
    }

    async doSql(query: string, params?: any){
        const sql = await this.connect();
        const res = await sql.query(query, params)
        return res;
    }

    async getRows(values: string, table: string, where: string, params?: any[], additional_query: string = "") {
        const res = await this.doSql(`SELECT ${values} FROM ${table} WHERE ${where} ${additional_query}`, params)
        return res;
    }

    async getSingleRow(values: string, table: string, where: string, params?: any[], additional_query: string = "") {
        const [res] = await this.getRows(values, table, where, params, additional_query);
        return res;
    }

    async insertRow(table: string, columns: string, values: string, params?: any[], additional_query: string = "") {
        await this.doSql(`INSERT INTO ${table} (${columns}) VALUES (${values}) ${additional_query}`, params)
    }

    async deleteRow(table: string, where: string, params?: any[], additional_query: string = "") {
        await this.doSql(`DELETE FROM ${table} WHERE ${where} ${additional_query}`, params)
    }
    // </core>

    // <auth>
    async getUser(user_id: bigint, values: string = "*") {
        const user = await this.getSingleRow(values, "Users", "user_id = $1", [user_id])
        if (!user) return;
        const parsed_user = user as User;
        parsed_user.permissions = new Permissions(user["permissions"] ?? 0)
        return parsed_user;
    }

    async createUser(permissions: Permissions) {
        const convertedPermissions = permissions.getAll();
        await this.insertRow("Users", "permissions", "$1", [convertedPermissions])
    }

    async deleteUser(user_id: bigint) {
        await this.deleteRow("Users", "user_id = $1", [user_id])
    }

    async getUserIntegrations(user_id: bigint, values: string = "*") {
        const integrations = await this.getSingleRow(values, "UsersIntegrations", "user_id = $1", [user_id])
    }
    // </auth>
}
