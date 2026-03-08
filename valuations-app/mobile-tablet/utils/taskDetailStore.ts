import type { WorkflowTask } from '../api/workflowTasks';

let selectedTask: WorkflowTask | null = null;

export function setTaskForDetail(task: WorkflowTask): void {
  selectedTask = task;
}

export function getTaskForDetail(): WorkflowTask | null {
  return selectedTask;
}

export function clearTaskForDetail(): void {
  selectedTask = null;
}
