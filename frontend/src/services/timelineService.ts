import { api } from './api';

export interface TimelineEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  type: 'project' | 'phase' | 'task';
}

class TimelineService {
  async getTimelineEvents(): Promise<TimelineEvent[]> {
    return api.get('/timeline/events');
  }

  async getProjectTimeline(projectId: string): Promise<TimelineEvent[]> {
    return api.get(`/timeline/projects/${projectId}`);
  }
}

export default new TimelineService();
