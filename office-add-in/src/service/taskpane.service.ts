export class TaskpaneService {
    constructor() {}

    public async getZaken(caseNumber: string): Promise<any> {
        fetch(`http://localhost:3003/zaken/${caseNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log("Data:", data);
                return data;
            })
            .catch(error => {
                console.error("Error:", error);
                return [];
            });
    }

}