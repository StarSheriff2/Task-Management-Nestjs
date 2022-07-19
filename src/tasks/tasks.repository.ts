import { InternalServerErrorException, Logger } from '@nestjs/common';
import { User } from 'src/auth/users.entity';
import { EntityRepository, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

@EntityRepository(Task)
export class TasksRepository extends Repository<Task> {
  private logger = new Logger('TasksRepository');

  getTasks(filterTasksDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterTasksDto;
    const query = this.createQueryBuilder('task');
    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        'LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    try {
      const tasks = query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve tasks from user "${
          user.username
        }". Filters: ${JSON.stringify(filterTasksDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    const task: Task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    try {
      const newTask = this.save(task);
      return newTask;
    } catch (error) {
      this.logger.error(
        `Failed to save a new task from user "${
          user.username
        }". Data: ${JSON.stringify(createTaskDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
    return task;
  }
}
