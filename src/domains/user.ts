export class User {
  id: number;
  username: string;
  workSchedule: number[];
  startDate: string | null;
  debt_duty: any[];

  constructor(id: number, username: string, workSchedule: number[], startDate: string | null, debt_duty: any[]) {
    this.id = id;
    this.username = username;
    this.workSchedule = workSchedule;
    this.startDate = startDate;
    this.debt_duty = debt_duty;
  }
}