import { QueueEntry } from '../queue-entry.entity';

describe('QueueEntry Entity', () => {
  let queueEntry: QueueEntry;

  beforeEach(() => {
    queueEntry = new QueueEntry();
  });

  it('should be defined', () => {
    expect(queueEntry).toBeDefined();
  });

  it('should have correct properties', () => {
    const patient = { id: 1, name: 'John Smith' };

    queueEntry.id = 1;
    queueEntry.patientId = 1;
    queueEntry.queueNumber = 5;
    queueEntry.status = 'waiting';
    queueEntry.priority = 'normal';
    queueEntry.arrivalTime = new Date();
    queueEntry.estimatedWaitTime = 15;
    queueEntry.patient = patient;
    queueEntry.createdAt = new Date();
    queueEntry.updatedAt = new Date();

    expect(queueEntry.id).toBe(1);
    expect(queueEntry.patientId).toBe(1);
    expect(queueEntry.queueNumber).toBe(5);
    expect(queueEntry.status).toBe('waiting');
    expect(queueEntry.priority).toBe('normal');
    expect(queueEntry.arrivalTime).toBeInstanceOf(Date);
    expect(queueEntry.estimatedWaitTime).toBe(15);
    expect(queueEntry.patient).toBe(patient);
    expect(queueEntry.createdAt).toBeInstanceOf(Date);
    expect(queueEntry.updatedAt).toBeInstanceOf(Date);
  });

  it('should accept valid status values', () => {
    const validStatuses = ['waiting', 'with_doctor', 'completed'];
    
    validStatuses.forEach((status) => {
      queueEntry.status = status;
      expect(queueEntry.status).toBe(status);
    });
  });

  it('should accept valid priority values', () => {
    const validPriorities = ['normal', 'urgent'];
    
    validPriorities.forEach((priority) => {
      queueEntry.priority = priority;
      expect(queueEntry.priority).toBe(priority);
    });
  });

  it('should allow nullable estimated wait time', () => {
    queueEntry.estimatedWaitTime = null;
    expect(queueEntry.estimatedWaitTime).toBeNull();
  });
});