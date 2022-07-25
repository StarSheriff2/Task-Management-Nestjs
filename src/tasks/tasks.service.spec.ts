import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { User } from '../auth/users.entity';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

const mockTasksRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
});

const mockUser: User = {
  username: 'TestUser',
  password: 'somepassword',
  tasks: [],
  id: 'someId',
};

describe('TasksService', () => {
  let tasksService: TasksService;
  let tasksRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: TasksRepository,
          useFactory: mockTasksRepository,
        },
      ],
    }).compile();

    tasksService = module.get(TasksService);
    tasksRepository = module.get(TasksRepository);
  });

  describe('getTasks', () => {
    it('calls TasksRepository.getTasks and returns the result', async () => {
      tasksRepository.getTasks.mockResolvedValue('someValue');
      const result = await tasksService.getTasks(null, mockUser);
      expect(result).toEqual('someValue');
    });
  });

  describe('getTaskById', () => {
    it('calls TasksRepository.findOne and returns result', async () => {
      const mockTask: Task = {
        title: 'Mop house',
        description: 'vacuum first',
        id: 'someValue',
        status: TaskStatus.OPEN,
        user: mockUser,
      };

      tasksRepository.findOne.mockResolvedValue(mockTask);
      const result = await tasksService.getTaskById('abc123', mockUser);
      expect(result).toEqual(mockTask);
      expect(result).not.toEqual({ ...mockTask, title: 'Wash bathrooms' });
    });

    it('throws an error of notFoundException if a task was not found', () => {
      tasksRepository.findOne.mockResolvedValue(null);

      expect(tasksService.getTaskById('abc123', mockUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(tasksService.getTaskById('abc123', mockUser)).rejects.not.toThrow(
        BadRequestException,
      );
    });
  });
});
