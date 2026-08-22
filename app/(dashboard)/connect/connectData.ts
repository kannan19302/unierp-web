export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMins: number;
  withMeet: boolean;
  attendeeIds: string[];
  description?: string;
  location?: string;
  color?: string;
  allDay?: boolean;
  recurrence?: any;
  meetingCode?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
}

export const api = {
  events: async (): Promise<CalendarEvent[]> => [],
  directory: async (): Promise<Member[]> => [],
  createEvent: async (ev: any) => {},
  deleteEvent: async (id: string) => {},
};
