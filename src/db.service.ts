import {Injectable} from "@nestjs/common";
import {neon, NeonQueryFunction} from "@neondatabase/serverless";

function decToBinBuiltIn(n: number): string {
    if (n < 0) throw new Error("Number should be a positive integer");
    return (n >>> 0).toString(2);
}

export class Permissions {
    private _permissions: number = 0

    private PermissionsMap: string[] = [
        "admin"
    ]

    public set(key: string, value: boolean): Permissions {
        if (!this.PermissionsMap.includes(key)) {
            return this;
        }
        let binary = decToBinBuiltIn(this._permissions)
        while (binary.length < this.PermissionsMap.length) {
            binary = "0" + binary
        }
        const index = binary.length - 1 - this.PermissionsMap.indexOf(key);
        let result = "";
        result = binary.slice(0, index) + (value ? "1" : "0")
        if (index + 1 < binary.length) result += binary.slice(index + 1);
        this._permissions = parseInt(result, 2);
        return this;
    }

    public get(key: string): boolean {
        if (!this.PermissionsMap.includes(key)) return false;
        const binary = decToBinBuiltIn(this._permissions)
        const index = binary.length - 1 - this.PermissionsMap.indexOf(key);
        return binary[index] == "1";
    }

    public getAll(): number {
        return this._permissions;
    }
}

export interface User {
    user_id: string,
    permissions: Permissions
}

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

    async getRows(values: string, table: string, where: string, params?: any[], additional_query?: string) {
        const res = await this.doSql(`SELECT ${values} FROM ${table} WHERE ${where} ${additional_query}`, params)
        return res;
    }

    async getSingleRow(values: string, table: string, where: string, params?: any[], additional_query?: string) {
        const [res] = await this.getRows(values, table, where, params, additional_query);
        return res;
    }

    async insertRow(table: string, columns: string, values: string, params?: any[], additional_query?: string) {
        await this.doSql(`INSERT INTO ${table} (${columns}) VALUES (${values})`, params)
    }
    // </core>

    // <auth>
    async getUser(user_id: string, values: string = "*") {
        const user = await this.getSingleRow(values, "Users", "user_id = $1", [user_id])
        return user as User;
    }

    async createUser(permissions: Permissions) {
        const convertedPermissions = permissions.getAll();
        await this.insertRow("Users", "permissions", "$1", [convertedPermissions])
    }
    // </auth>
}
