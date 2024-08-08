export class DutySchedule {
  date: string;
  weekday: number;
  employees: string[];
  constructor(date: string, weekday: number, employees: string[]) {
    this.date = date;
    this.weekday = weekday;
    this.employees = employees;
  }
}