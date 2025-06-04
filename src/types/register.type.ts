export interface RegisterCreatePayload {
  studentId: number;
  subjectId: number;
  score?: number;
}

export interface RegisterScorePayload {
  score: number;
}
