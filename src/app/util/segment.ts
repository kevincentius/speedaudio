
export interface SegmentStep {
  text: string;
  note?: string;
  speed?: number;
}

export interface Segment {
  name: string;
  steps: SegmentStep[];
}
