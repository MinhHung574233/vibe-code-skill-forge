import { LearningModule, type LearningConfig } from '@/features/learning/ui/LearningModule';
import { JAVA_PATHS } from '../domain/content';

const CONFIG: LearningConfig = {
  moduleId: 'java',
  activityType: 'java_lesson',
  title: 'Java & Spring Boot',
  basePath: '/practice/java',
  paths: JAVA_PATHS,
};

/** Module root, mounted at `practice/java/*`. */
export function JavaModule() {
  return <LearningModule config={CONFIG} />;
}
