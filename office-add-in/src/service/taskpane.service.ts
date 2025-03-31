export class TaskpaneService {
  constructor() {}

  public async getZaken(caseNumber: string): Promise<any> {
    console.log("Button clicked! Case Number:", caseNumber);

    const backendUrl = "https://funny-stars-fall.loca.lt";

    fetch(`${backendUrl}/zaken/${caseNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Data:", data);
        return data;
      })
      .catch((error) => {
        console.error("Error:", error);
        return [];
      });
  }
}
