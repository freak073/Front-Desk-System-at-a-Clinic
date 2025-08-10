import { UpdateDoctorScheduleDto } from '../';

describe('DTO Barrel Export', () => {
  it('should export UpdateDoctorScheduleDto', () => {
    const dto = new UpdateDoctorScheduleDto();
    expect(dto).toBeInstanceOf(UpdateDoctorScheduleDto);
  });
});
