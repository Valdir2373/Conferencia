export interface ConferenceInputDataUpdate {
  date: Date;
  conference: { [key: string]: number };
  id: string;
  updated: Date;
}
