import { google } from "googleapis";
import path from "path";

class GoogleSheet {
    credentialsPath = 'credentials.json';
    sheetName;
    // Constructor
    constructor(id, sheetName = 'Sheet1') {
        this.sheetName = sheetName;
        this.id = id;
        this.auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(this.credentialsPath),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    // Get the auth client
    async getAuthClient() {
        if (!this.authClient) this.authClient = await this.auth.getClient();
        return this.authClient;
    }

    // Read Sheet Data
    async read() {
        let auth = await this.getAuthClient(),
            sheets = google.sheets({ version: 'v4', auth }),
            res = await sheets.spreadsheets.values.get({
                spreadsheetId: this.id,
                range: this.sheetName,
            });

        const rows = res.data.values;

        if (!rows || !rows.length) return true;
        return rows;

    }

    // Get Sheet Properties
    async getProps() {
        let auth = await this.getAuthClient(),
            sheets = google.sheets({ version: 'v4', auth });

        let response = await sheets.spreadsheets.get({
            spreadsheetId: this.id,
            ranges: [],
            includeGridData: false,
        });

        const properties = response.data.sheets.map(sheet => sheet.properties);

        return properties;
    }

    // Read Cell
    async readCell(row, column) {
        let auth = await this.getAuthClient(),
            sheets = google.sheets({ version: 'v4', auth });

        let response = await sheets.spreadsheets.values.get({
            spreadsheetId: this.id,
            range: `${this.sheetName}!${column}${row}`,
        });

        const values = response.data.values;
        if (!values || !values.length) return false;

        return values[0][0];
    }

    // Update Cell
    async updateCell(data) {
        let { row, column, value } = data,
            auth = await this.getAuthClient(),
            sheets = google.sheets({ version: 'v4', auth });

        let response = await sheets.spreadsheets.values.update({
            spreadsheetId: this.id,
            range: `${this.sheetName}!${column}${row}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[value]],
            },
        });

        return response.data;
    }


}

export default GoogleSheet;