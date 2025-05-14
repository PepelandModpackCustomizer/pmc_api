import {Injectable} from "@nestjs/common";
import {neon, NeonQueryFunction} from "@neondatabase/serverless";

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

    async getRows(values: string, table: string, where: string, params?: any, additional_query?: string) {
        const res = await this.doSql(`SELECT ${values} FROM ${table} WHERE ${where} ${additional_query}`, params)
        return res;
    }

    async getSingleRow(values: string, table: string, where: string, params?: any, additional_query?: string) {
        const [res] = await this.getRows(values, table, where, params, additional_query);
        return res;
    }
    // </core>

    // <auth>
    async getUser(user_id: string, values: string = "*") {
        const user = await this.getSingleRow(values, "Users", "user_id = $1", [user_id])
        return user;
    }
    // </auth>
}
